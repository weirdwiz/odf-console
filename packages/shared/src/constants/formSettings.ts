import { UseFormProps } from 'react-hook-form';

export const formSettings = {
  mode: 'onBlur',
  reValidateMode: 'onChange',
  context: undefined,
  criteriaMode: 'firstError',
  shouldFocusError: true,
  shouldUnregister: false,
  shouldUseNativeValidation: false,
  delayError: undefined,
} satisfies UseFormProps;
