import { PersistentVolumeClaimKind } from '@odf/shared/types';
import * as Yup from 'yup';
import { StoreProviders } from './mcg';

// SAFETY: value comes from the owner of the StoreProviders contract used at this boundary.
export const providerSchema = (shouldValidateSecret: boolean) =>
  Yup.object({
    'provider-name': Yup.string().required(),
    endpoint: Yup.string().when('provider-name', {
      is: (value: string) =>
        [StoreProviders.S3, StoreProviders.IBM].includes(
          /* SAFETY: The value is supplied by the StoreProviders owner and follows that contract. */ value as StoreProviders
        ),
      then: (schema: Yup.StringSchema) => schema.required(),
    }),
    'aws-region': Yup.string().when('provider-name', {
      is: StoreProviders.AWS,
      then: (schema: Yup.StringSchema) => schema.required(),
    }),
    secret: Yup.string().when('provider-name', {
      is: (value: string) =>
        [
          StoreProviders.AWS,
          StoreProviders.S3,
          StoreProviders.AZURE,
          StoreProviders.IBM,
        ].includes(
          /* SAFETY: The value is supplied by the StoreProviders owner and follows that contract. */ value as StoreProviders
        ),
      then: (schema: Yup.StringSchema) =>
        shouldValidateSecret ? schema.required() : schema.notRequired(),
    }),
    'secret-key': Yup.string().when('provider-name', {
      is: StoreProviders.GCP,
      then: (schema: Yup.StringSchema) => schema.required(),
    }),
    'target-bucket': Yup.string().when('provider-name', {
      is: (value: string) =>
        [
          StoreProviders.S3,
          StoreProviders.AWS,
          StoreProviders.AZURE,
          StoreProviders.IBM,
          StoreProviders.GCP,
        ].includes(
          /* SAFETY: The value is supplied by the StoreProviders owner and follows that contract. */ value as StoreProviders
        ),
      then: (schema: Yup.StringSchema) => schema.required(),
    }),
    'pvc-name': Yup.object().when('provider-name', {
      is: StoreProviders.FILESYSTEM,
      then: (schema: Yup.ObjectSchema<PersistentVolumeClaimKind>) =>
        schema.required(),
    }),
    'folder-name': Yup.string().when('provider-name', {
      is: StoreProviders.FILESYSTEM,
      then: (schema: Yup.StringSchema) => schema.required(),
    }),
  });
