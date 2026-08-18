import * as React from 'react';
import { ConfigMapModel, useK8sGet } from '@odf/shared';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import yaml from 'js-yaml';
import { isString } from 'lodash-es';
import {
  ODFMCO_OPERATOR_NAMESPACE,
  RAMEN_CONFIG_KEY,
  RAMEN_HUB_OPERATOR_CONFIG_NAME,
} from '../constants';
import { RamenConfig, S3StoreProfile } from '../types';

type ConfigMapKind = K8sResourceCommon & { data?: Record<string, string> };

const EMPTY_RAMEN_CONFIG: RamenConfig = { s3StoreProfiles: [] };

interface RamenConfigDocument {
  toString: () => string;
}

const isS3StoreProfile = (
  value: RamenConfigDocument
): value is RamenConfigDocument & S3StoreProfile =>
  's3ProfileName' in value &&
  isString(value.s3ProfileName) &&
  's3Bucket' in value &&
  isString(value.s3Bucket) &&
  's3Region' in value &&
  isString(value.s3Region) &&
  's3CompatibleEndpoint' in value &&
  isString(value.s3CompatibleEndpoint) &&
  's3SecretRef' in value &&
  value.s3SecretRef instanceof Object &&
  'name' in value.s3SecretRef &&
  isString(value.s3SecretRef.name);

const isRamenConfig = (
  value: RamenConfigDocument
): value is RamenConfigDocument & RamenConfig =>
  's3StoreProfiles' in value &&
  Array.isArray(value.s3StoreProfiles) &&
  value.s3StoreProfiles.every(
    (profile: RamenConfigDocument) =>
      profile instanceof Object && isS3StoreProfile(profile)
  );

export const useRamenConfig = (): [RamenConfig, boolean, unknown] => {
  const [cm, loaded, loadError] = useK8sGet<ConfigMapKind>(
    ConfigMapModel,
    RAMEN_HUB_OPERATOR_CONFIG_NAME,
    ODFMCO_OPERATOR_NAMESPACE
  );

  return React.useMemo((): [RamenConfig, boolean, unknown] => {
    if (!loaded || loadError) {
      return [EMPTY_RAMEN_CONFIG, loaded, loadError];
    }

    const raw = cm?.data?.[RAMEN_CONFIG_KEY];
    if (!raw) {
      return [
        EMPTY_RAMEN_CONFIG,
        loaded,
        new Error(
          `Missing key ${RAMEN_CONFIG_KEY} in ConfigMap ${RAMEN_HUB_OPERATOR_CONFIG_NAME}/${ODFMCO_OPERATOR_NAMESPACE}`
        ),
      ];
    }

    try {
      const ramenConfig = yaml.load(raw);
      if (
        !(ramenConfig instanceof Object) ||
        !isRamenConfig(ramenConfig)
      ) {
        throw new Error('Ramen configuration has no s3StoreProfiles array');
      }
      return [ramenConfig, loaded, loadError];
    } catch (err: unknown) {
      return [
        EMPTY_RAMEN_CONFIG,
        loaded,
        new Error(
          `Failed to parse YAML from ConfigMap ${RAMEN_HUB_OPERATOR_CONFIG_NAME}: ${
            err instanceof Error ? err.message : JSON.stringify(err)
          }`
        ),
      ];
    }
  }, [cm, loaded, loadError]);
};
