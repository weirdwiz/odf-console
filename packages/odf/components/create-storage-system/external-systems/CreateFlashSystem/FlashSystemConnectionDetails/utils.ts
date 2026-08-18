import { SecretKind } from '@odf/shared/types';
import * as _ from 'lodash-es';
import { IBMFlashSystemKind } from './system-types';

export const isIPRegistered = (address, registeredIPs) => {
  return registeredIPs?.includes(address);
};

// SAFETY: _.get returns unknown; the Secret data field is typed as a string index signature.
export const getSecretManagementAddress = <A extends SecretKind = SecretKind>(
  value: A
) =>
  /* SAFETY: _.get returns unknown; Secret data field has a string index signature. */ _.get(
    value,
    'data.management_address'
  ) as SecretKind['data']['management_address'];

// SAFETY: _.get returns unknown; the FlashSystem spec structure is known from the CRD.
export const getFlashSystemSecretName = <
  A extends IBMFlashSystemKind = IBMFlashSystemKind,
>(
  value: A
) =>
  /* SAFETY: _.get returns unknown; FlashSystem spec.secret.name is string per CRD. */ _.get(
    value,
    'spec.secret.name'
  ) as IBMFlashSystemKind['spec']['secret']['name'];
