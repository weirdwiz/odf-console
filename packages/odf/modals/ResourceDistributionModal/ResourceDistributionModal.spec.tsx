import * as React from 'react';
import { StorageConsumerKind } from '@odf/shared';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { resourceDistributionTableDeps } from '../../components/ResourceDistribution/ResourceDistributionTable';
import ResourceDistributionModal, {
  resourceDistributionModalDeps,
} from './ResourceDistributionModal';

jest
  .spyOn(resourceDistributionModalDeps, 'useCustomTranslation')
  .mockImplementation(jest.fn().mockReturnValue({ t: (key: string) => key }));
jest
  .spyOn(resourceDistributionModalDeps, 'useK8sWatchResources')
  .mockImplementation(
    jest.fn().mockReturnValue({
      storageClasses: {
        data: [
          {
            apiVersion: 'v1',
            kind: 'StorageClass',
            metadata: {
              name: 'test-storage-class',
              namespace: 'test-namespace',
            },
            provisioner: 'test-provisioner.rbd.csi.ceph.com',
          },
        ],
        loaded: true,
        error: null,
      },
      volumeSnapshotClasses: {
        data: [
          {
            apiVersion: 'v1',
            kind: 'VolumeSnapshotClass',
            metadata: {
              name: 'test-snapshot-class',
              namespace: 'test-namespace',
            },
            driver: 'test-provisioner.rbd.csi.ceph.com',
          },
        ],
        loaded: true,
        error: null,
      },
      volumeGroupSnapshotClasses: {
        data: [
          {
            apiVersion: 'v1beta1',
            kind: 'VolumeGroupSnapshotClass',
            metadata: {
              name: 'test-snapshot-class',
              namespace: 'test-namespace',
            },
            driver: 'test-provisioner.rbd.csi.ceph.com',
          },
        ],
        loaded: true,
        error: null,
      },
    })
  );
jest
  .spyOn(resourceDistributionModalDeps, 'k8sPatch')
  .mockImplementation(jest.fn());
jest
  .spyOn(resourceDistributionTableDeps, 'useListPageFilter')
  .mockImplementation(
    jest.fn().mockReturnValue([
      [],
      [
        {
          apiVersion: 'v1',
          kind: 'StorageClass',
          metadata: {
            name: 'test-storage-class',
            namespace: 'test-namespace',
          },
          provisioner: 'test-provisioner.rbd.csi.ceph.com',
        },
      ],
      jest.fn(),
    ])
  );

const storageConsumerResource: StorageConsumerKind = {
  apiVersion: 'v1',
  kind: 'StorageConsumer',
  metadata: {
    name: 'test-storage-consumer',
    namespace: 'test-namespace',
  },
  spec: {
    storageClasses: [
      {
        name: 'test-storage-class',
      },
    ],
    volumeSnapshotClasses: [],
    storageQuotaInGiB: 0,
  },
  status: {},
};
describe('Test ResourceDistributionModal', () => {
  it('Renders basic features correctly', () => {
    render(
      <ResourceDistributionModal
        isOpen={true}
        extraProps={{ resource: storageConsumerResource }}
        closeModal={jest.fn()}
      />
    );
    expect(
      screen.getByText('Manage distribution of resources')
    ).toBeInTheDocument();

    expect(screen.getByText('Storage classes')).toBeInTheDocument();
    const checkbox = screen.getAllByLabelText('Select row 0')[0];
    expect(checkbox).toBeChecked();
  });
});
