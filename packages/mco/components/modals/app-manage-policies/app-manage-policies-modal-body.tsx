import * as React from 'react';
import { isACMApplication, isArgoApplicationSet } from '@odf/mco/utils';
import { VirtualMachineModel } from '@odf/shared';
import { getGVKofResource, referenceForModel } from '@odf/shared/utils';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import {
  ApplicationSetParser,
  SubscriptionParser,
  VirtualMachineParser,
} from './parsers';
import { ModalViewContext } from './utils/reducer';

// Memoizing the component to prevent unnecessary re-renders.
// Problem: Without React.memo, the component re-renders even if props haven't changed.
// Fix: React.memo ensures the component only re-renders when `application`, `cluster`, or `setCurrentModalContext` changes.
export const AppManagePoliciesModalBody: React.FC<AppManagePoliciesModalBodyProps> =
  React.memo(({ application, cluster, setCurrentModalContext }) => {
    if (isArgoApplicationSet(application)) {
      return (
        <ApplicationSetParser
          application={application}
          setCurrentModalContext={setCurrentModalContext}
        />
      );
    }

    if (isACMApplication(application)) {
      return (
        <SubscriptionParser
          application={application}
          setCurrentModalContext={setCurrentModalContext}
        />
      );
    }

    return getGVKofResource(application) ===
      referenceForModel(VirtualMachineModel) ? (
      <VirtualMachineParser
        application={application}
        cluster={cluster}
        setCurrentModalContext={setCurrentModalContext}
      />
    ) : null;
  });

type AppManagePoliciesModalBodyProps = {
  application: K8sResourceCommon;
  cluster?: string;
  setCurrentModalContext: React.Dispatch<
    React.SetStateAction<ModalViewContext>
  >;
};
