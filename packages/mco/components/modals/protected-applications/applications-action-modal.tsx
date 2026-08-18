import * as React from 'react';
import { ApplicationType, DRActionType } from '@odf/mco/constants';
import { useApplicationFromPAV } from '@odf/mco/hooks/use-application-pav';
import { ProtectedApplicationViewKind } from '@odf/mco/types/pav';
import { isACMApplication, isArgoApplicationSet } from '@odf/mco/utils';
import { useCustomTranslation } from '@odf/shared';
import { CommonModalProps } from '@odf/shared/modals';
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated';
import { Bullseye, Spinner, Alert } from '@patternfly/react-core';
import { ArogoApplicationSetParser } from '../app-failover-relocate/parser/argo-application-set-parser';
import { SubscriptionFailoverRelocateModal } from '../app-failover-relocate/subscriptions/failover-relocate-modal';

type ApplicationActionModalProps = {
  pav: ProtectedApplicationViewKind;
  action: DRActionType.FAILOVER | DRActionType.RELOCATE;
};

export const ApplicationActionModal: React.FC<
  CommonModalProps<ApplicationActionModalProps>
> = ({ isOpen, closeModal, extraProps: { pav, action } }) => {
  const { application, loaded, error, appInfo } = useApplicationFromPAV(pav);
  const { t } = useCustomTranslation();

  if (!loaded || error || !application) {
    return (
      <Modal
        variant={ModalVariant.small}
        isOpen={isOpen}
        onClose={closeModal}
        title={action}
      >
        {!loaded ? (
          <Bullseye>
            <Spinner size="lg" />
          </Bullseye>
        ) : (
          <Alert variant="danger" title={t('Failed to fetch application')}>
            {error?.message}
          </Alert>
        )}
      </Modal>
    );
  }

  if (
    appInfo?.type === ApplicationType.ApplicationSet &&
    isArgoApplicationSet(application)
  ) {
    return (
      <ArogoApplicationSetParser
        action={action}
        application={application}
        isOpen={isOpen}
        close={closeModal}
      />
    );
  }

  return isACMApplication(application) ? (
    <SubscriptionFailoverRelocateModal
      action={action}
      resource={application}
      isOpen={isOpen}
      close={closeModal}
    />
  ) : null;
};
