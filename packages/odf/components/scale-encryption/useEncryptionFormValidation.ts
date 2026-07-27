import * as React from 'react';
import { formSettings, useYupValidationResolver } from '@odf/shared';
import { fieldRequirementsTranslations } from '@odf/shared/constants';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { TFunction } from 'i18next';
import {
  Control,
  FieldValues,
  Resolver,
  UseFormGetValues,
  UseFormHandleSubmit,
  UseFormProps,
  useForm,
} from 'react-hook-form';
import * as Yup from 'yup';

const HOSTNAME_MIN_LENGTH = 1;
const USERNAME_MAX_LENGTH = 63;
const USERNAME_MIN_LENGTH = 1;
const PORT_MIN = 1;
const PORT_MAX = 65535;
const TENANT_ID_MAX_LENGTH = 16;
const CLIENT_MAX_LENGTH = 16;
const REMOTE_RKM_MAX_LENGTH = 21;
const SERVER_INFO_MAX_LENGTH = 255;

export type EncryptionFormData = {
  encryptionUserName: string;
  encryptionPassword: string;
  encryptionPort: string;
  client: string;
  remoteRKM: string;
  serverInformation: string;
  tenantId: string;
};

export const encryptionFormDefaultValues: EncryptionFormData = {
  encryptionUserName: '',
  encryptionPassword: '',
  encryptionPort: '',
  client: '',
  remoteRKM: '',
  serverInformation: '',
  tenantId: '',
};

const isValidIPv4 = (value: string): boolean => {
  const parts = value.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const number = Number(part);
    return (
      Number.isInteger(number) &&
      number >= 0 &&
      number <= 255 &&
      part === number.toString()
    );
  });
};

const hostnameRegex =
  /^[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9](\.[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9])*$|^[a-zA-Z]$/;

const isValidHostnameOrIP = (value: string): boolean =>
  isValidIPv4(value) || (/[a-zA-Z]/.test(value) && hostnameRegex.test(value));

export const getEncryptionFormSchema = (t: TFunction, isRequired: boolean) => {
  const required = (schema: Yup.StringSchema, message: string) =>
    isRequired ? schema.required(message) : schema.optional();
  const optionalEmpty = (value: string) => (!!value ? value : undefined);
  const portMessage = t('Must be a number between {{min}} and {{max}}', {
    min: PORT_MIN,
    max: PORT_MAX,
  });
  const remoteRKMMaxLength = fieldRequirementsTranslations.maxChars(
    t,
    REMOTE_RKM_MAX_LENGTH
  );
  const remoteRKMMinLength = fieldRequirementsTranslations.minChars(
    t,
    HOSTNAME_MIN_LENGTH
  );
  const invalidRemoteRKM = t('Must be a valid hostname or IP address');

  return {
    encryptionUserName: required(
      Yup.string()
        .max(
          USERNAME_MAX_LENGTH,
          fieldRequirementsTranslations.maxChars(t, USERNAME_MAX_LENGTH)
        )
        .min(
          USERNAME_MIN_LENGTH,
          fieldRequirementsTranslations.minChars(t, USERNAME_MIN_LENGTH)
        ),
      t('Username is required')
    ).transform(optionalEmpty),
    encryptionPassword: required(
      Yup.string(),
      t('Password is required')
    ).transform(optionalEmpty),
    encryptionPort: Yup.string()
      .optional()
      .matches(/^\d+$/, portMessage)
      .test('port-range', portMessage, (value) => {
        if (!value) return true;
        const parsedPort = Number(value);
        return parsedPort >= PORT_MIN && parsedPort <= PORT_MAX;
      })
      .transform(optionalEmpty),
    client: required(
      Yup.string().max(
        CLIENT_MAX_LENGTH,
        fieldRequirementsTranslations.maxChars(t, CLIENT_MAX_LENGTH)
      ),
      t('Client is required')
    ).transform(optionalEmpty),
    remoteRKM: required(
      Yup.string()
        .max(REMOTE_RKM_MAX_LENGTH, remoteRKMMaxLength)
        .min(HOSTNAME_MIN_LENGTH, remoteRKMMinLength)
        .test('valid-hostname-or-ip', invalidRemoteRKM, (value) =>
          value ? isValidHostnameOrIP(value) : true
        ),
      t('Remote RKM is required')
    ).transform(optionalEmpty),
    serverInformation: required(
      Yup.string().max(
        SERVER_INFO_MAX_LENGTH,
        fieldRequirementsTranslations.maxChars(t, SERVER_INFO_MAX_LENGTH)
      ),
      t('Server information is required')
    ).transform(optionalEmpty),
    tenantId: required(
      Yup.string().max(
        TENANT_ID_MAX_LENGTH,
        fieldRequirementsTranslations.maxChars(t, TENANT_ID_MAX_LENGTH)
      ),
      t('Tenant ID is required')
    ).transform(optionalEmpty),
  };
};

type EncryptionFormValidation = {
  control: Control<FieldValues>;
  formState: { isValid: boolean };
  getValues: UseFormGetValues<EncryptionFormData>;
  handleSubmit: UseFormHandleSubmit<EncryptionFormData>;
};

export const useEncryptionFormValidation = (): EncryptionFormValidation => {
  const { t } = useCustomTranslation();
  const schema = React.useMemo(
    () => Yup.object(getEncryptionFormSchema(t, true)),
    [t]
  );
  const resolver = useYupValidationResolver<EncryptionFormData>(
    schema
  ) as unknown as Resolver<EncryptionFormData>;
  const {
    control,
    formState: { isValid },
    getValues,
    handleSubmit,
  } = useForm<EncryptionFormData>({
    ...(formSettings as unknown as UseFormProps<EncryptionFormData>),
    mode: 'onChange',
    resolver,
    defaultValues: encryptionFormDefaultValues,
  });

  return {
    control: control as unknown as Control<FieldValues>,
    formState: { isValid },
    getValues,
    handleSubmit,
  };
};
