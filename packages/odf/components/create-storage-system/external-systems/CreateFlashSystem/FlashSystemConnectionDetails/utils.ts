import { SecretKind } from '@odf/shared/types';
import * as _ from 'lodash-es';
import { IBMFlashSystemKind } from './system-types';

export const isIPRegistered = (address, registeredIPs) => {
  return registeredIPs?.includes(address);
};

// SAFETY: _.get( value, 'data.management_address' ) comes from the owner of the SecretKind['data']['management_address'] contract used at this boundary.
export const getSecretManagementAddress = <A extends SecretKind = SecretKind>(
  value: A
) =>
  /* SAFETY: The value is supplied by the SecretKind['data']['management_address'] owner and follows that contract. */ _.get(
    value,
    'data.management_address'
  ) as SecretKind['data']['management_address'];

// SAFETY: _.get( value, 'spec.secret.name' ) comes from the owner of the IBMFlashSystemKind['spec']['secret']['name'] contract used at this boundary.
export const getFlashSystemSecretName = <
  A extends IBMFlashSystemKind = IBMFlashSystemKind,
>(
  value: A
) =>
  /* SAFETY: The value is supplied by the IBMFlashSystemKind['spec']['secret']['name'] owner and follows that contract. */ _.get(
    value,
    'spec.secret.name'
  ) as IBMFlashSystemKind['spec']['secret']['name'];
