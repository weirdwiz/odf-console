import * as React from 'react';
import {
  IBM_SCALE_LOCAL_CLUSTER_NAME,
  IBM_SCALE_NAMESPACE,
} from '@odf/core/constants';
import useIsRemoteClusterDeletable from '@odf/core/hooks/useIsRemoteClusterDeletable';
import { ClusterKind, RemoteClusterKind } from '@odf/core/types/scale';
import { getName } from '@odf/shared';
import { ModalFooter } from '@odf/shared/generic/ModalTitle';
import { CommonModalProps } from '@odf/shared/modals/Modal';
import { ClusterModel, RemoteClusterModel } from '@odf/shared/models/scale';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { isNotFoundError } from '@odf/shared/utils';
import {
  k8sDelete,
  k8sGet,
  k8sList,
} from '@openshift-console/dynamic-plugin-sdk';
import { useNavigate } from 'react-router';
import {
  ActionGroup,
  Alert,
  Button,
  FormGroup,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  TextInput,
} from '@patternfly/react-core';

export const removeRemoteClusterModalDeps = {
  useIsRemoteClusterDeletable,
  useNavigate,
  // SAFETY: The deps wrapper delegates to k8sDelete; the cast preserves the generic signature for test spying.
  k8sDelete: k8sDelete as typeof k8sDelete,
  // SAFETY: The deps wrapper delegates to k8sGet; the cast preserves the generic signature for test spying.
  k8sGet: k8sGet as typeof k8sGet,
  // SAFETY: The deps wrapper delegates to k8sList; the cast preserves the generic signature for test spying.
  k8sList: k8sList as typeof k8sList,
};

type RemoveRemoteClusterModalProps = CommonModalProps<{
  resource: RemoteClusterKind;
}>;

// SAFETY: The deletion client rejects with either Error or an object that has a message.
const getErrorMessage = (cause: unknown): string =>
  cause instanceof Error
    ? cause.message
    : (cause as { message?: string })?.message || String(cause);

const RemoveRemoteClusterModal: React.FC<RemoveRemoteClusterModalProps> = ({
  isOpen,
  closeModal,
  extraProps: { resource },
}) => {
  const { t } = useCustomTranslation();
  const navigate = removeRemoteClusterModalDeps.useNavigate();
  const clusterName = getName(resource);
  const isRemoteClusterDeletable =
    removeRemoteClusterModalDeps.useIsRemoteClusterDeletable(clusterName);

  const [inProgress, setInProgress] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [confirmName, setConfirmName] = React.useState('');

  const isConfirmNameValid = clusterName === confirmName;

  const handleRemove = async () => {
    setInProgress(true);
    setError('');
    let failureMessage = t('Failed to remove remote cluster');

    try {
      try {
        await removeRemoteClusterModalDeps.k8sDelete({
          model: RemoteClusterModel,
          resource,
          requestInit: null,
          json: null,
        });
      } catch (deleteError) {
        if (!isNotFoundError(deleteError)) {
          throw deleteError;
        }
      }

      failureMessage = t('Failed to list remote clusters');
      // SAFETY: k8sList returns K8sResourceCommon[]; the model guarantees RemoteClusterKind shape.
      const remoteClusters = (await removeRemoteClusterModalDeps.k8sList({
        model: RemoteClusterModel,
        queryParams: { ns: IBM_SCALE_NAMESPACE },
      })) as RemoteClusterKind[];
      const hasRemainingRemoteClusters = remoteClusters.some(
        (remoteCluster) => getName(remoteCluster) !== clusterName
      );

      if (!hasRemainingRemoteClusters) {
        failureMessage = t('Failed to get the local Scale cluster');
        let localCluster: ClusterKind | undefined;

        try {
          // SAFETY: k8sGet returns K8sResourceCommon; the model guarantees ClusterKind shape.
          localCluster = (await removeRemoteClusterModalDeps.k8sGet({
            model: ClusterModel,
            name: IBM_SCALE_LOCAL_CLUSTER_NAME,
            ns: IBM_SCALE_NAMESPACE,
          })) as ClusterKind;
        } catch (getError) {
          if (!isNotFoundError(getError)) {
            throw getError;
          }
        }

        if (localCluster) {
          failureMessage = t('Failed to delete the local Scale cluster');
          await removeRemoteClusterModalDeps.k8sDelete({
            model: ClusterModel,
            resource: localCluster,
            requestInit: null,
            json: null,
          });
        }
      }

      closeModal();
      navigate('/odf/external-systems');
    } catch (removeError) {
      setError(`${failureMessage}: ${getErrorMessage(removeError)}`);
      setInProgress(false);
    }
  };

  const title = t('Remove {{clusterName}}?', { clusterName });
  const description = t(
    'Removing {{clusterName}} means you will no longer be able to access the remote file systems',
    { clusterName }
  );
  return (
    <Modal
      isOpen={isOpen}
      aria-label={title}
      variant={ModalVariant.small}
      onClose={closeModal}
    >
      <ModalHeader title={title} description={description} />
      <ModalBody>
        <FormGroup
          label={t('Type {{name}} to confirm', { name: clusterName })}
          fieldId="confirm-name"
          className="pf-v6-u-mt-md"
        >
          <TextInput
            id="confirm-name"
            aria-label={t('Confirm name')}
            value={confirmName}
            onChange={(_event, value) => setConfirmName(value)}
            data-test="confirm-name-input"
          />
        </FormGroup>
        {error && (
          <Alert
            isInline
            variant="danger"
            title={t('An error occurred')}
            className="pf-v6-u-mt-md"
            data-test="remove-error-alert"
          >
            {error}
          </Alert>
        )}
      </ModalBody>
      <ModalFooter inProgress={inProgress}>
        <ActionGroup>
          <Button
            key="remove"
            variant="danger"
            onClick={handleRemove}
            isDisabled={
              inProgress || !isConfirmNameValid || !isRemoteClusterDeletable
            }
            isLoading={inProgress}
            data-test="remove-action"
          >
            {t('Remove')}
          </Button>
          <Button
            key="cancel"
            variant="link"
            onClick={closeModal}
            data-test="cancel-action"
          >
            {t('Cancel')}
          </Button>
        </ActionGroup>
      </ModalFooter>
    </Modal>
  );
};

export default RemoveRemoteClusterModal;
