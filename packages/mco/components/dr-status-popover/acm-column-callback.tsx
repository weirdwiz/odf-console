import * as React from 'react';
import { SearchResultItemType } from '@odf/mco/types';
import {
  convertSearchResult,
  getGVKFromK8Resource,
  isACMApplication,
  isArgoApplicationSet,
} from '@odf/mco/utils';
import { VirtualMachineModel } from '@odf/shared';
import { referenceForModel } from '@odf/shared/utils';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { isString } from 'lodash-es';
import { ApplicationSetParser, SubscriptionParser } from './parsers';
import VirtualMachineParser from './parsers/virtualmachine-parser';

const isSearchResult = (
  resource: K8sResourceCommon | SearchResultItemType
): resource is SearchResultItemType =>
  'apiversion' in resource &&
  isString(resource.apiversion) &&
  'kind' in resource &&
  isString(resource.kind) &&
  'name' in resource &&
  isString(resource.name) &&
  'cluster' in resource &&
  isString(resource.cluster) &&
  'created' in resource &&
  isString(resource.created) &&
  'label' in resource &&
  isString(resource.label) &&
  '_uid' in resource &&
  isString(resource._uid) &&
  (!('namespace' in resource) ||
    resource.namespace === undefined ||
    isString(resource.namespace)) &&
  (!('apigroup' in resource) ||
    resource.apigroup === undefined ||
    isString(resource.apigroup));

const DRStatus: React.FC<DRStatusProps> = ({ resource }) => {
  if (!resource) return null;

  const application =
    isSearchResult(resource) ? convertSearchResult(resource) : resource;
  const gvk = getGVKFromK8Resource(application);

  return (
    <>
      {isArgoApplicationSet(application) && (
        <ApplicationSetParser application={application} />
      )}
      {isACMApplication(application) && (
        <SubscriptionParser application={application} />
      )}
      {gvk === referenceForModel(VirtualMachineModel) && (
        <VirtualMachineParser virtualMachine={application} />
      )}
    </>
  );
};

type DRStatusProps = {
  resource: K8sResourceCommon | SearchResultItemType;
};

export default DRStatus;
