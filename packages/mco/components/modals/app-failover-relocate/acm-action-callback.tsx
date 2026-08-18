import * as React from 'react';
import { DRActionType } from '../../../constants';
import { ACMApplicationKind } from '../../../types';
import { isACMApplication, isArgoApplicationSet } from '../../../utils';
import { ArogoApplicationSetParser as ArogoApplicationSetModal } from './parser/argo-application-set-parser';
import { SubscriptionFailoverRelocateModal } from './subscriptions/failover-relocate-modal';

export const ApplicationFailover = (props: ModalProps) => {
  const { resource, close, isOpen } = props;

  return (
    <>
      {isArgoApplicationSet(resource) && (
        <ArogoApplicationSetModal
          action={DRActionType.FAILOVER}
          application={resource}
          isOpen={isOpen}
          close={close}
        />
      )}
      {isACMApplication(resource) && (
        <SubscriptionFailoverRelocateModal
          action={DRActionType.FAILOVER}
          resource={resource}
          isOpen={isOpen}
          close={close}
        />
      )}
    </>
  );
};

export const ApplicationRelocate = (props: ModalProps) => {
  const { resource, close, isOpen } = props;

  return (
    <>
      {isArgoApplicationSet(resource) && (
        <ArogoApplicationSetModal
          action={DRActionType.RELOCATE}
          application={resource}
          isOpen={isOpen}
          close={close}
        />
      )}
      {isACMApplication(resource) && (
        <SubscriptionFailoverRelocateModal
          action={DRActionType.RELOCATE}
          resource={resource}
          isOpen={isOpen}
          close={close}
        />
      )}
    </>
  );
};

// ACM application action props
type ModalProps = {
  isOpen: boolean;
  resource: ACMApplicationKind;
  close: () => void;
};
