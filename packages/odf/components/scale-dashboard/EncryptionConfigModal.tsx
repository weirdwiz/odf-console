import * as React from 'react';
import { enableScaleEncryption } from '@odf/core/components/scale-encryption/enableScaleEncryption';
import { EncryptionConfigForm } from '@odf/core/components/scale-encryption/EncryptionConfigForm';
import {
  EncryptionFormData,
  useEncryptionFormValidation,
} from '@odf/core/components/scale-encryption/useEncryptionFormValidation';
import { useCustomTranslation } from '@odf/shared';
import {
  Alert,
  Button,
  Form,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';

type EncryptionConfigModalProps = {
  closeModal: () => void;
  isOpen: boolean;
  systemName: string;
};

const EncryptionConfigModal: React.FC<EncryptionConfigModalProps> = ({
  closeModal,
  isOpen,
  systemName,
}) => {
  const { t } = useCustomTranslation();
  const [certificate, setCertificate] = React.useState('');
  const [certificateFileName, setCertificateFileName] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const {
    control,
    formState: { isValid },
    handleSubmit,
  } = useEncryptionFormValidation();

  const enableEncryption = React.useCallback(
    async (values: EncryptionFormData) => {
      setError('');
      setIsSubmitting(true);

      try {
        await enableScaleEncryption(systemName, values, certificate);
        closeModal();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        setIsSubmitting(false);
      }
    },
    [certificate, closeModal, systemName]
  );

  const onCertificateInputChange = React.useCallback((_event, file: File) => {
    setCertificateFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCertificate(event.target?.result as string);
    };
    reader.readAsText(file);
  }, []);

  const close = React.useCallback(() => {
    if (!isSubmitting) closeModal();
  }, [closeModal, isSubmitting]);

  return (
    <Modal isOpen={isOpen} onClose={close} variant={ModalVariant.small}>
      <ModalHeader title={t('Enable data encryption')} />
      <ModalBody>
        <p>
          {t(
            'Opting in encryption requires username, password, port, backup server information. This change applies to the local cluster and will affect all IBM Scale CNSA remote cluster connections.'
          )}
        </p>
        <Form
          id="encryption-config-form"
          onSubmit={handleSubmit(enableEncryption)}
        >
          <EncryptionConfigForm
            certificate={certificate}
            certificateFileName={certificateFileName}
            control={control}
            isDisabled={isSubmitting}
            onCertificateClear={() => {
              setCertificate('');
              setCertificateFileName('');
            }}
            onCertificateInputChange={onCertificateInputChange}
          />
        </Form>
        {error && (
          <Alert
            isInline
            variant="danger"
            title={t('Unable to update data encryption')}
            className="pf-v6-u-mt-md"
          >
            {error}
          </Alert>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          type="submit"
          form="encryption-config-form"
          isDisabled={!isValid || isSubmitting}
          isLoading={isSubmitting}
        >
          {t('Save')}
        </Button>
        <Button variant="link" onClick={close} isDisabled={isSubmitting}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default EncryptionConfigModal;
