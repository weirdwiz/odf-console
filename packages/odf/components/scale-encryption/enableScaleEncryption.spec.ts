import {
  K8sResourceCommon,
  k8sCreate,
  k8sDelete,
} from '@openshift-console/dynamic-plugin-sdk';
import * as TestDependency1 from '@openshift-console/dynamic-plugin-sdk';
import {
  enableScaleEncryption,
  ScaleEncryptionInput,
} from './enableScaleEncryption';

jest.spyOn(TestDependency1, 'k8sCreate').mockImplementation(jest.fn());
jest.spyOn(TestDependency1, 'k8sDelete').mockImplementation(jest.fn());

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
    jest.mocked(k8sCreate).mockImplementation(createdResource);
    jest.mocked(k8sDelete).mockResolvedValue(undefined);
  });

  it('creates the encryption resources in dependency order', async () => {
    await enableScaleEncryption(input);

    expect(
      jest.mocked(k8sCreate).mock.calls.map(([request]) => request.data)
    ).toEqual([
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
    jest
      .mocked(k8sCreate)
      .mockImplementationOnce(createdResource)
      .mockImplementationOnce(createdResource)
      .mockRejectedValueOnce(new Error('EncryptionConfig failed'));

    await expect(enableScaleEncryption(input)).rejects.toThrow(
      'EncryptionConfig failed'
    );

    expect(
      jest
        .mocked(k8sDelete)
        .mock.calls.map(([request]) => request.resource.metadata.name)
    ).toEqual(['encryption-secret', 'encryption-config']);
  });
});
