import { BackendType, ReplicationType } from '@odf/mco/constants';
import { ManagedClusterInfoType, MirrorPeerKind } from '@odf/mco/types';
import {
  createPolicyPromises,
  drPolicyK8sDependencies,
} from './k8s-utils';
import { drPolicyInitialState, DRPolicyState } from './reducer';

const mockCreateOrUpdate = jest.spyOn(
  drPolicyK8sDependencies,
  'createOrUpdate'
);
const mockK8sGet = jest
  .spyOn(drPolicyK8sDependencies, 'k8sGet')
  .mockImplementation(jest.fn());
const mockK8sCreate = jest
  .spyOn(drPolicyK8sDependencies, 'k8sCreate')
  .mockImplementation(jest.fn());
const mockK8sUpdate = jest
  .spyOn(drPolicyK8sDependencies, 'k8sUpdate')
  .mockImplementation(jest.fn());
const mockK8sDelete = jest
  .spyOn(drPolicyK8sDependencies, 'k8sDelete')
  .mockImplementation(jest.fn());

const notFound = { response: { status: 404 } };
const forbidden = { response: { status: 403 } };
const conflict = { response: { status: 409 } };

const managedCluster = (
  name: string,
  storageClusterName: string
): ManagedClusterInfoType => ({
  metadata: { name },
  id: name,
  isManagedClusterAvailable: true,
  odfInfo: {
    storageClusterInfo: {
      storageClusterNamespacedName: `${storageClusterName}/openshift-storage`,
      cephFSID: `fsid-${name}`,
      deploymentType: 'internal',
    },
    odfVersion: '4.20.0',
    isValidODFVersion: true,
    storageClusterCount: 1,
  },
});

const state: DRPolicyState = {
  ...drPolicyInitialState,
  clusters: {
    ...drPolicyInitialState.clusters,
    selectedClusters: [
      managedCluster('east-1', 'ocs-storagecluster'),
      managedCluster('west-1', 'ocs-storagecluster'),
    ],
  },
  configure: {
    ...drPolicyInitialState.configure,
    replicationBackend: BackendType.DataFoundation,
  },
  policy: {
    ...drPolicyInitialState.policy,
    policyName: 'policy-1',
    replicationType: ReplicationType.ASYNC,
  },
};

const peerItem = (clusterName: string) => ({
  clusterName,
  storageClusterRef: {
    name: 'ocs-storagecluster',
    namespace: 'openshift-storage',
  },
});

const existingMirrorPeer = {
  metadata: { name: 'mirrorpeer-existing' },
  spec: { items: [peerItem('east-1'), peerItem('west-1')] },
} satisfies MirrorPeerKind;

const existingPolicy = {
  metadata: { name: 'policy-1', uid: 'uid-1', resourceVersion: '1' },
  spec: { drClusters: ['east-1', 'west-1'], schedulingInterval: '10m' },
};

const resolveCreate = ({ model, data }) =>
  Promise.resolve(
    model.kind === 'MirrorPeer'
      ? { ...data, metadata: { name: 'mirrorpeer-new' } }
      : data
  );

describe('createPolicyPromises DRPolicy create vs update detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateOrUpdate.mockImplementation(
      async ({ model, name, namespace, mutate, mutationDetails }) => {
        try {
          const current = await mockK8sGet({ model, name, ns: namespace });
          const result = await mockK8sUpdate({
            model,
            data: mutate(current),
          });
          mutationDetails.isUpdated = true;
          return result;
        } catch (error) {
          if (error?.response?.status !== 404) throw error;
          try {
            const result = await mockK8sCreate({
              model,
              data: mutate(null),
            });
            mutationDetails.isUpdated = false;
            return result;
          } catch (createError) {
            if (createError?.response?.status !== 409) throw createError;
            const current = await mockK8sGet({ model, name, ns: namespace });
            const result = await mockK8sUpdate({
              model,
              data: mutate(current),
            });
            mutationDetails.isUpdated = true;
            return result;
          }
        }
      }
    );
    mockK8sCreate.mockImplementation(({ data }) => Promise.resolve(data));
    mockK8sUpdate.mockImplementation(({ data }) => Promise.resolve(data));
    mockK8sDelete.mockResolvedValue({});
  });

  it('sets isNewPolicy from createOrUpdate create vs update', async () => {
    mockK8sGet.mockRejectedValueOnce(notFound);
    await expect(
      createPolicyPromises(state, [existingMirrorPeer])
    ).resolves.toMatchObject({
      isNewPolicy: true,
      isNewMirrorPeer: false,
      mirrorPeerName: 'mirrorpeer-existing',
    });
    expect(mockK8sUpdate).not.toHaveBeenCalled();

    jest.clearAllMocks();
    mockK8sUpdate.mockImplementation(({ data }) => Promise.resolve(data));
    mockK8sGet.mockResolvedValue(existingPolicy);
    await expect(
      createPolicyPromises(state, [existingMirrorPeer])
    ).resolves.toMatchObject({ isNewPolicy: false });
    expect(mockK8sCreate).not.toHaveBeenCalled();
  });

  it('fails closed on forbidden GET; 404→409 race becomes an update', async () => {
    mockK8sGet.mockRejectedValue(forbidden);
    await expect(
      createPolicyPromises(state, [existingMirrorPeer])
    ).rejects.toEqual(forbidden);

    mockK8sGet
      .mockRejectedValueOnce(notFound)
      .mockResolvedValue(existingPolicy);
    mockK8sCreate.mockRejectedValueOnce(conflict);
    await expect(
      createPolicyPromises(state, [existingMirrorPeer])
    ).resolves.toMatchObject({ isNewPolicy: false });
  });

  it('creates MirrorPeer when missing and rolls it back if DRPolicy create fails', async () => {
    mockK8sGet.mockRejectedValue(notFound);
    mockK8sCreate.mockImplementation(resolveCreate);
    await expect(createPolicyPromises(state, [])).resolves.toMatchObject({
      isNewMirrorPeer: true,
      mirrorPeerName: 'mirrorpeer-new',
      isNewPolicy: true,
    });

    mockK8sGet.mockRejectedValue(forbidden);
    mockK8sCreate.mockImplementation(resolveCreate);
    await expect(createPolicyPromises(state, [])).rejects.toEqual(forbidden);
    expect(mockK8sDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: expect.objectContaining({
          metadata: expect.objectContaining({ name: 'mirrorpeer-new' }),
        }),
      })
    );
  });

  it('does not match MirrorPeer with same SC name but different namespace', async () => {
    mockK8sGet.mockRejectedValue(notFound);
    mockK8sCreate.mockImplementation(resolveCreate);
    const staleMirrorPeer = {
      metadata: { name: 'mirrorpeer-stale' },
      spec: {
        items: [
          {
            clusterName: 'east-1',
            storageClusterRef: {
              name: 'ocs-storagecluster',
              namespace: 'other-storage',
            },
          },
          {
            clusterName: 'west-1',
            storageClusterRef: {
              name: 'ocs-storagecluster',
              namespace: 'other-storage',
            },
          },
        ],
      },
    } satisfies MirrorPeerKind;

    await expect(
      createPolicyPromises(state, [staleMirrorPeer])
    ).resolves.toMatchObject({
      isNewMirrorPeer: true,
      mirrorPeerName: 'mirrorpeer-new',
    });
  });
});
