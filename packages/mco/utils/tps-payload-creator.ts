import {
  ConfigMapModel,
  DRClusterModel,
  SecretKind,
  SecretModel,
} from '@odf/shared';
import { getAPIVersionForModel } from '@odf/shared/utils';
import { createOrUpdate } from '@odf/shared/utils/k8s';
import {
  k8sDelete,
  k8sGet,
  K8sResourceCommon,
  K8sResourceKind,
  k8sUpdate,
} from '@openshift-console/dynamic-plugin-sdk';
import { t } from 'i18next';
import { Base64 } from 'js-base64';
import yaml from 'js-yaml';
import * as _ from 'lodash-es';
import { murmur3 } from 'murmurhash-js';
import { retryWithBackoff } from '../../odf/utils/retry';
import {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  ODFMCO_OPERATOR_NAMESPACE,
  RAMEN_CONFIG_KEY,
  RAMEN_HUB_OPERATOR_CONFIG_NAME,
} from '../constants';
import {
  DRClusterKind,
  RamenConfig,
  S3StoreProfile,
  type S3Details,
} from '../types';

type ConfigMapKind = K8sResourceCommon & { data?: Record<string, string> };

interface YAMLDocument {
  toString: () => string;
}

const isS3StoreProfile = (
  value: YAMLDocument
): value is YAMLDocument & S3StoreProfile =>
  value instanceof Object &&
  's3ProfileName' in value &&
  _.isString(value.s3ProfileName) &&
  's3Bucket' in value &&
  _.isString(value.s3Bucket) &&
  's3Region' in value &&
  _.isString(value.s3Region) &&
  's3CompatibleEndpoint' in value &&
  _.isString(value.s3CompatibleEndpoint) &&
  's3SecretRef' in value &&
  value.s3SecretRef instanceof Object &&
  'name' in value.s3SecretRef &&
  _.isString(value.s3SecretRef.name) &&
  (!('namespace' in value.s3SecretRef) ||
    value.s3SecretRef.namespace === undefined ||
    _.isString(value.s3SecretRef.namespace));

const isRamenConfig = (
  value: YAMLDocument
): value is YAMLDocument & RamenConfig =>
  value instanceof Object &&
  's3StoreProfiles' in value &&
  Array.isArray(value.s3StoreProfiles) &&
  value.s3StoreProfiles.every(
    (profile: YAMLDocument) =>
      profile instanceof Object && isS3StoreProfile(profile)
  ) &&
  (!('retainNamespaceSCCAcrossPeers' in value) ||
    value.retainNamespaceSCCAcrossPeers === undefined ||
    _.isBoolean(value.retainNamespaceSCCAcrossPeers));

const parseRamenConfig = (raw: string): RamenConfig => {
  const value = yaml.load(raw);
  if (value == null) {
    return { s3StoreProfiles: [] };
  }
  if (!(value instanceof Object)) {
    throw new Error('Ramen configuration has an invalid shape');
  }
  if (!('s3StoreProfiles' in value)) {
    Object.assign(value, { s3StoreProfiles: [] });
  }
  if (!isRamenConfig(value)) {
    throw new Error('Ramen configuration has an invalid shape');
  }
  return value;
};

export function murmur32Hex(str: string, seed = 0): string {
  const h = murmur3(str, seed);
  return h.toString(16).padStart(8, '0');
}

export async function fetchRamenS3Profiles(
  namespace: string = ODFMCO_OPERATOR_NAMESPACE
): Promise<S3StoreProfile[]> {
  let cm: ConfigMapKind;

  try {
    cm = await k8sGet<ConfigMapKind>({
      model: ConfigMapModel,
      name: RAMEN_HUB_OPERATOR_CONFIG_NAME,
      ns: namespace,
    });
  } catch (error: unknown) {
    throw new Error(
      `Failed to fetch ConfigMap ${RAMEN_HUB_OPERATOR_CONFIG_NAME} in namespace ${namespace}: ${error instanceof Error ? error.message : JSON.stringify(error)}`
    );
  }

  const raw = cm.data?.[RAMEN_CONFIG_KEY];
  if (!raw) {
    throw new Error(
      `Missing key ${RAMEN_CONFIG_KEY} in ConfigMap ${RAMEN_HUB_OPERATOR_CONFIG_NAME}/${namespace}`
    );
  }

  let ramenConfig: RamenConfig;
  try {
    ramenConfig = parseRamenConfig(raw);
  } catch (error: unknown) {
    throw new Error(
      `Failed to parse YAML from ConfigMap ${RAMEN_HUB_OPERATOR_CONFIG_NAME}: ${error instanceof Error ? error.message : JSON.stringify(error)}`
    );
  }

  return ramenConfig.s3StoreProfiles || [];
}

export function createSecretNameFromS3(
  s3: Pick<
    S3Details,
    'clusterName' | 'bucketName' | 'endpoint' | 'region' | 's3ProfileName'
  >,
  prefix = 's3'
): string {
  const key = [
    s3.clusterName,
    s3.bucketName,
    s3.endpoint,
    s3.region,
    s3.s3ProfileName,
  ].join('|');
  const hash = murmur32Hex(key);
  return `${prefix}-${hash}`.slice(0, 39);
}

const areS3ProfileFieldsEqual = (
  a: S3StoreProfile,
  b: S3StoreProfile
): boolean => _.isEqual(a, b);

const updateS3ProfileFields = (src: S3StoreProfile, dest: S3StoreProfile) => {
  const copy = _.cloneDeep(src);
  Object.assign(dest, copy);
};

type UpdateRamenHubConfigArgs = {
  namespace?: string;
  profile: S3StoreProfile;
  remove?: boolean;
};

export function updateRamenHubOperatorConfig({
  namespace = ODFMCO_OPERATOR_NAMESPACE,
  profile,
  remove = false,
}: UpdateRamenHubConfigArgs): Promise<K8sResourceCommon> {
  return retryWithBackoff(
    () => attemptConfigMapUpdate(namespace, profile, remove),
    { maxRetries: 3, initialDelayMs: 500 }
  );
}

async function attemptConfigMapUpdate(
  namespace: string,
  profile: S3StoreProfile,
  remove: boolean
): Promise<K8sResourceCommon> {
  const cm = await k8sGet<ConfigMapKind>({
    model: ConfigMapModel,
    name: RAMEN_HUB_OPERATOR_CONFIG_NAME,
    ns: namespace,
  });

  const raw = cm.data?.[RAMEN_CONFIG_KEY];
  if (!raw) {
    throw new Error(
      t('Missing key {{key}} in ConfigMap {{name}}/{{namespace}}', {
        key: RAMEN_CONFIG_KEY,
        name: RAMEN_HUB_OPERATOR_CONFIG_NAME,
        namespace,
      })
    );
  }

  const ramenConfig = parseRamenConfig(raw);

  const idx = ramenConfig.s3StoreProfiles.findIndex(
    (p) => p.s3ProfileName === profile.s3ProfileName
  );

  if (remove) {
    if (idx !== -1) {
      ramenConfig.s3StoreProfiles.splice(idx, 1);
    } else {
      return cm;
    }
  } else if (idx === -1) {
    ramenConfig.s3StoreProfiles.push(profile);
  } else if (
    !areS3ProfileFieldsEqual(profile, ramenConfig.s3StoreProfiles[idx])
  ) {
    updateS3ProfileFields(profile, ramenConfig.s3StoreProfiles[idx]);
  } else {
    return cm;
  }

  const updatedCm = {
    ...cm,
    data: {
      ...(cm.data || {}),
      [RAMEN_CONFIG_KEY]: yaml.dump(ramenConfig),
    },
  };

  return k8sUpdate<ConfigMapKind>({
    model: ConfigMapModel,
    data: updatedCm,
  });
}

export function deleteDRCluster(name: string): Promise<K8sResourceKind> {
  const drCluster: DRClusterKind = {
    apiVersion: getAPIVersionForModel(DRClusterModel),
    kind: DRClusterModel.kind,
    metadata: { name },
    spec: { s3ProfileName: '' },
  };
  return k8sDelete<DRClusterKind>({
    model: DRClusterModel,
    resource: drCluster,
  });
}

export function createDRCluster(params: {
  name: string;
  s3ProfileName: string;
}): Promise<DRClusterKind> {
  const { name, s3ProfileName } = params;

  return createOrUpdate<DRClusterKind>({
    model: DRClusterModel,
    name,
    mutate: (current) => {
      const drCluster: DRClusterKind = current ?? {
        apiVersion: getAPIVersionForModel(DRClusterModel),
        kind: DRClusterModel.kind,
        metadata: { name },
        spec: { s3ProfileName: s3ProfileName },
      };

      return {
        ...drCluster,
        spec: {
          ...drCluster.spec,
          s3ProfileName: s3ProfileName,
        },
      };
    },
  });
}

type CreateRamenS3SecretArgs = {
  name: string;
  accessKeyId: string;
  secretAccessKey: string;
  namespace?: string;
};

export const createOrUpdateRamenS3Secret = ({
  name,
  accessKeyId,
  secretAccessKey,
  namespace = ODFMCO_OPERATOR_NAMESPACE,
}: CreateRamenS3SecretArgs) =>
  createOrUpdate<SecretKind>({
    model: SecretModel,
    name,
    namespace,
    mutate: (current) => {
      const base: SecretKind = current ?? {
        apiVersion: getAPIVersionForModel(SecretModel),
        kind: SecretModel.kind,
        metadata: { name, namespace },
        type: 'Opaque',
      };

      return {
        ...base,
        type: 'Opaque',
        data: {
          [AWS_ACCESS_KEY_ID]: Base64.encode(accessKeyId),
          [AWS_SECRET_ACCESS_KEY]: Base64.encode(secretAccessKey),
        },
      };
    },
  });
