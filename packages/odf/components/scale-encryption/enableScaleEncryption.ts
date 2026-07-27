import { IBM_SCALE_NAMESPACE } from '@odf/core/constants';
import { EncryptionConfigKind } from '@odf/core/types/scale';
import {
  ConfigMapKind,
  ConfigMapModel,
  SecretKind,
  SecretModel,
} from '@odf/shared';
import { EncryptionConfigModel } from '@odf/shared/models/scale';
import {
  K8sModel,
  k8sCreate,
  k8sDelete,
} from '@openshift-console/dynamic-plugin-sdk';
import { EncryptionFormData } from './useEncryptionFormValidation';

const namespacedResourceRef = (name: string) => ({
  metadata: { name, namespace: IBM_SCALE_NAMESPACE },
});

export const enableScaleEncryption = async (
  systemName: string,
  values: EncryptionFormData,
  certificate: string
): Promise<void> => {
  const configName = `${systemName}-encryption-config`;
  const secretName = `${systemName}-encryption-secret`;
  const createdResources: { model: K8sModel; name: string }[] = [];

  try {
    const secret: SecretKind = {
      apiVersion: 'v1',
      kind: SecretModel.kind,
      metadata: { name: secretName, namespace: IBM_SCALE_NAMESPACE },
      type: 'Opaque',
      stringData: {
        username: values.encryptionUserName,
        password: values.encryptionPassword,
      },
    };
    await k8sCreate({ model: SecretModel, data: secret });
    createdResources.push({ model: SecretModel, name: secretName });

    if (certificate) {
      const certificateConfigMap: ConfigMapKind = {
        apiVersion: 'v1',
        kind: ConfigMapModel.kind,
        metadata: { name: configName, namespace: IBM_SCALE_NAMESPACE },
        data: { 'enc-ca.crt': certificate },
      };
      await k8sCreate({ model: ConfigMapModel, data: certificateConfigMap });
      createdResources.push({ model: ConfigMapModel, name: configName });
    }

    const encryptionConfig: EncryptionConfigKind = {
      apiVersion: 'scale.spectrum.ibm.com/v1beta1',
      kind: 'EncryptionConfig',
      metadata: { name: configName, namespace: IBM_SCALE_NAMESPACE },
      spec: {
        ...(certificate && { cacert: configName }),
        server: values.serverInformation,
        tenant: values.tenantId,
        client: values.client,
        port: Number(values.encryptionPort || 9443),
        ...(values.remoteRKM && { remoteRKM: values.remoteRKM }),
        secret: secretName,
      },
    };
    await k8sCreate({ model: EncryptionConfigModel, data: encryptionConfig });
  } catch (cause) {
    await Promise.allSettled(
      createdResources.reverse().map(({ model, name }) =>
        k8sDelete({
          model,
          resource: namespacedResourceRef(name),
          requestInit: null,
          json: null,
        })
      )
    );
    throw cause;
  }
};
