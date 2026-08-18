import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { payloadDeps } from '../create-storage-system/external-systems/common/payload';
import {
  enableScaleEncryption,
  enableScaleEncryptionDeps,
  ScaleEncryptionInput,
} from './enableScaleEncryption';

jest
  .spyOn(enableScaleEncryptionDeps, 'k8sCreate')
  .mockImplementation(jest.fn());
jest
  .spyOn(enableScaleEncryptionDeps, 'k8sDelete')
  .mockImplementation(jest.fn());
jest.spyOn(payloadDeps, 'k8sCreate').mockImplementation(jest.fn());

const input: ScaleEncryptionInput = {
  certificate: 'certificate',
  client: 'scale-client',
  password: 'password',
  port: '9444',
  remoteRKM: 'rkm.example.com',
  server: 'keyserver.example.com',
  tenant: 'tenant',
  username: 'encryption-user',
};

const createdResource = ({ data }: { data: K8sResourceCommon }) =>
  Promise.resolve(data);

describe('enableScaleEncryption', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(payloadDeps.k8sCreate).mockImplementation(createdResource);
    jest
      .mocked(enableScaleEncryptionDeps.k8sCreate)
      .mockImplementation(createdResource);
    jest
      .mocked(enableScaleEncryptionDeps.k8sDelete)
      .mockResolvedValue(undefined);
  });

  it('creates the encryption resources in dependency order', async () => {
    await enableScaleEncryption(input);

    const payloadCalls = jest
      .mocked(payloadDeps.k8sCreate)
      .mock.calls.map(([request]) => request.data);
    const encCalls = jest
      .mocked(enableScaleEncryptionDeps.k8sCreate)
      .mock.calls.map(([request]) => request.data);
    const allCalls = [...payloadCalls, ...encCalls];

    expect(allCalls).toEqual([
      expect.objectContaining({
        kind: 'ConfigMap',
        data: { 'enc-ca.crt': 'certificate' },
      }),
      expect.objectContaining({
        kind: 'Secret',
        stringData: { password: 'password', username: 'encryption-user' },
      }),
      expect.objectContaining({
        kind: 'EncryptionConfig',
        spec: {
          cacert: 'encryption-config',
          client: 'scale-client',
          port: 9444,
          remoteRKM: 'rkm.example.com',
          secret: 'encryption-secret',
          server: 'keyserver.example.com',
          tenant: 'tenant',
        },
      }),
    ]);
  });

  it('removes created dependencies when setup fails', async () => {
    jest.mocked(payloadDeps.k8sCreate).mockImplementation(createdResource);
    jest
      .mocked(enableScaleEncryptionDeps.k8sCreate)
      .mockRejectedValueOnce(new Error('EncryptionConfig failed'));

    await expect(enableScaleEncryption(input)).rejects.toThrow(
      'EncryptionConfig failed'
    );

    expect(
      jest
        .mocked(enableScaleEncryptionDeps.k8sDelete)
        .mock.calls.map(([request]) => request.resource.metadata.name)
    ).toEqual(['encryption-secret', 'encryption-config']);
  });
});
