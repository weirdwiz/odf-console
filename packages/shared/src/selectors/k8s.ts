import {
  K8sResourceCommon,
  K8sResourceCondition,
  K8sResourceKind,
} from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash-es';

type GetStringProperty<T = K8sResourceCommon> = (resource: T) => string;

export const getName: GetStringProperty = (resource) =>
  resource?.metadata?.name;

export const getUID: GetStringProperty = (resource) => resource?.metadata?.uid;

export const hasLabel = (obj: K8sResourceCommon, label: string): boolean =>
  _.has(obj, ['metadata', 'labels', label]);

export const getLabel = <A extends K8sResourceCommon = K8sResourceCommon>(
  value: A,
  label: string,
  defaultValue?: string
) =>
  _.has(value, 'metadata.labels') ? value.metadata.labels[label] : defaultValue;

// SAFETY: _.get(value, 'metadata.labels') comes from the owner of the K8sResourceCommon['metadata']['labels'] contract used at this boundary.
export const getLabels = <A extends K8sResourceCommon = K8sResourceCommon>(
  value: A
) =>
  /* SAFETY: The value is supplied by the K8sResourceCommon['metadata']['labels'] owner and follows that contract. */ _.get(
    value,
    'metadata.labels'
  ) as K8sResourceCommon['metadata']['labels'];

// SAFETY: _.get( value, 'metadata.namespace' ) comes from the owner of the K8sResourceCommon['metadata']['namespace'] contract used at this boundary.
export const getNamespace = <A extends K8sResourceCommon = K8sResourceCommon>(
  value: A
) =>
  /* SAFETY: The value is supplied by the K8sResourceCommon['metadata']['namespace'] owner and follows that contract. */ _.get(
    value,
    'metadata.namespace'
  ) as K8sResourceCommon['metadata']['namespace'];

export const getAnnotations = <A extends K8sResourceCommon = K8sResourceCommon>(
  value: A,
  defaultValue?: K8sResourceCommon['metadata']['annotations']
) =>
  _.has(value, 'metadata.annotations')
    ? value.metadata.annotations
    : defaultValue;

// SAFETY: _.get(value, 'apiVersion') comes from the owner of the K8sResourceCommon['apiVersion'] contract used at this boundary.
export const getAPIVersion = <A extends K8sResourceCommon = K8sResourceCommon>(
  value: A
) =>
  /* SAFETY: The value is supplied by the K8sResourceCommon['apiVersion'] owner and follows that contract. */ _.get(
    value,
    'apiVersion'
  ) as K8sResourceCommon['apiVersion'];

// SAFETY: _.get( value, 'metadata.ownerReferences' ) comes from the owner of the K8sResourceCommon['metadata']['ownerReferences'] contract used at this boundary.
export const getOwnerReferences = <
  A extends K8sResourceCommon = K8sResourceCommon,
>(
  value: A
) =>
  /* SAFETY: The value is supplied by the K8sResourceCommon['metadata']['ownerReferences'] owner and follows that contract. */ _.get(
    value,
    'metadata.ownerReferences'
  ) as K8sResourceCommon['metadata']['ownerReferences'];

export const findCondition = (
  conditions: K8sResourceCondition[] | undefined,
  type: string,
  options?: { ignoreCase?: boolean }
): K8sResourceCondition | undefined => {
  if (!conditions?.length) {
    return undefined;
  }
  if (options?.ignoreCase) {
    const normalizedType = type.toLowerCase();
    return conditions.find(
      (current) => current.type?.toLowerCase() === normalizedType
    );
  }
  return conditions.find((current) => current.type === type);
};

export const isConditionStatus = (
  condition: Pick<K8sResourceCondition, 'status'> | undefined,
  status: string
): boolean => condition?.status?.toLowerCase() === status.toLowerCase();

export const getResourceCondition = <
  A extends K8sResourceKind = K8sResourceKind,
>(
  resource: A,
  condition: string,
  options?: { ignoreCase?: boolean }
): K8sResourceCondition | undefined => {
  return findCondition(resource?.status?.conditions, condition, options);
};

export const getCreationTimestamp: GetStringProperty = (resource) =>
  resource?.metadata?.creationTimestamp;
