import {
  ACMManagedClusterModel,
  ACMPlacementDecisionModel,
  ACMPlacementModel,
  ACMPlacementRuleModel,
  ACMSubscriptionModel,
  ArgoApplicationSetModel,
  DRClusterModel,
  DRPlacementControlModel,
  DRPolicyModel,
  MirrorPeerModel,
} from '@odf/shared';
import {
  ApplicationModel,
  ProtectedApplicationViewModel,
} from '@odf/shared/models';
import { referenceForModel } from '@odf/shared/utils';
import { Selector } from '@openshift-console/dynamic-plugin-sdk';
import {
  HUB_CLUSTER_NAME,
  SUBMARINER_ADDON_KIND,
  SUBMARINER_BROKER_KIND,
  SUBMARINER_CLUSTER_KIND,
} from '../constants';

export const getDRClusterResourceObj = (props?: ClusterScopeObjectType) =>
  (() => {
    const value = {
      cluster: HUB_CLUSTER_NAME,
      kind: referenceForModel(DRClusterModel),
      namespaced: false,
      optional: true,
    };
    if (!!props?.name) Object.assign(value, { name: props?.name });
    if (!props?.name) Object.assign(value, { isList: true });
    return value;
  })();

export const getDRPolicyResourceObj = (props?: ClusterScopeObjectType) =>
  (() => {
    const value = {
      cluster: HUB_CLUSTER_NAME,
      kind: referenceForModel(DRPolicyModel),
      namespaced: false,
      optional: true,
    };
    if (!!props?.name) Object.assign(value, { name: props?.name });
    if (!props?.name) Object.assign(value, { isList: true });
    return value;
  })();

export const getMirrorPeerResourceObj = (props?: ClusterScopeObjectType) =>
  (() => {
    const value = {
      cluster: HUB_CLUSTER_NAME,
      kind: referenceForModel(MirrorPeerModel),
      namespaced: false,
      optional: true,
    };
    if (!!props?.name) Object.assign(value, { name: props?.name });
    if (!props?.name) Object.assign(value, { isList: true });
    return value;
  })();

export const getManagedClusterResourceObj = (props?: ClusterScopeObjectType) =>
  (() => {
    const value = {
      cluster: HUB_CLUSTER_NAME,
      kind: referenceForModel(ACMManagedClusterModel),
      namespaced: false,
      optional: true,
    };
    if (!!props?.name) Object.assign(value, { name: props?.name });
    if (!props?.name) Object.assign(value, { isList: true });
    return value;
  })();

export const getDRPlacementControlResourceObj = (
  props?: NamespacedObjectType
) =>
  (() => {
    const value = {
      cluster: HUB_CLUSTER_NAME,
      kind: referenceForModel(DRPlacementControlModel),
      namespaced: !!props?.namespace ? false : true,
      optional: true,
    };
    if (!!props?.name) Object.assign(value, { name: props?.name });
    if (!!props?.namespace)
      Object.assign(value, { namespace: props?.namespace });
    if (!props?.name) Object.assign(value, { isList: true });
    if (!!props?.selector) Object.assign(value, { selector: props?.selector });
    return value;
  })();

export const getProtectedApplicationViewResourceObj = (namespace?: string) => ({
  cluster: HUB_CLUSTER_NAME,
  kind: ProtectedApplicationViewModel.kind,
  namespaced: true,
  isList: true,
  groupVersionKind: {
    group: ProtectedApplicationViewModel.apiGroup,
    version: ProtectedApplicationViewModel.apiVersion,
    kind: ProtectedApplicationViewModel.kind,
  },
  ...(namespace && { namespace }),
});

export const getApplicationSetResourceObj = (props?: NamespacedObjectType) =>
  (() => {
    const value = {
      cluster: HUB_CLUSTER_NAME,
      kind: referenceForModel(ArgoApplicationSetModel),
      namespaced: !!props?.namespace ? true : false,
      optional: true,
    };
    if (!!props?.name) Object.assign(value, { name: props?.name });
    if (!!props?.namespace)
      Object.assign(value, { namespace: props?.namespace });
    if (!props?.name) Object.assign(value, { isList: true });
    return value;
  })();

export const getPlacementResourceObj = (props?: NamespacedObjectType) =>
  (() => {
    const value = {
      cluster: HUB_CLUSTER_NAME,
      kind: referenceForModel(ACMPlacementModel),
      namespaced: !!props?.namespace ? true : false,
      optional: true,
    };
    if (!!props?.name) Object.assign(value, { name: props?.name });
    if (!!props?.namespace)
      Object.assign(value, { namespace: props?.namespace });
    if (!props?.name) Object.assign(value, { isList: true });
    return value;
  })();

export const getPlacementDecisionsResourceObj = (
  props?: NamespacedObjectType
) =>
  (() => {
    const value = {
      cluster: HUB_CLUSTER_NAME,
      kind: referenceForModel(ACMPlacementDecisionModel),
      namespaced: !!props?.namespace ? true : false,
      optional: true,
    };
    if (!!props?.name) Object.assign(value, { name: props?.name });
    if (!!props?.namespace)
      Object.assign(value, { namespace: props?.namespace });
    if (!props?.name) Object.assign(value, { isList: true });
    if (!!props?.selector) Object.assign(value, { selector: props?.selector });
    return value;
  })();

export const getPlacementRuleResourceObj = (props?: NamespacedObjectType) =>
  (() => {
    const value = {
      cluster: HUB_CLUSTER_NAME,
      kind: referenceForModel(ACMPlacementRuleModel),
      namespaced: !!props?.namespace ? true : false,
      optional: true,
    };
    if (!!props?.name) Object.assign(value, { name: props?.name });
    if (!!props?.namespace)
      Object.assign(value, { namespace: props?.namespace });
    if (!props?.name) Object.assign(value, { isList: true });
    return value;
  })();

export const getSubscriptionResourceObj = (props?: NamespacedObjectType) =>
  (() => {
    const value = {
      cluster: HUB_CLUSTER_NAME,
      kind: referenceForModel(ACMSubscriptionModel),
      namespaced: !!props?.namespace ? true : false,
      optional: true,
    };
    if (!!props?.name) Object.assign(value, { name: props?.name });
    if (!!props?.namespace)
      Object.assign(value, { namespace: props?.namespace });
    if (!props?.name) Object.assign(value, { isList: true });
    return value;
  })();

export const getApplicationResourceObj = (props?: NamespacedObjectType) =>
  (() => {
    const value = {
      cluster: HUB_CLUSTER_NAME,
      kind: referenceForModel(ApplicationModel),
      namespaced: !!props?.namespace ? true : false,
      optional: true,
    };
    if (!!props?.name) Object.assign(value, { name: props?.name });
    if (!!props?.namespace)
      Object.assign(value, { namespace: props?.namespace });
    if (!props?.name) Object.assign(value, { isList: true });
    return value;
  })();

const getSubmarinerHubListResourceObj = (kind: string) => ({
  cluster: HUB_CLUSTER_NAME,
  kind,
  isList: true,
  namespaced: false,
  optional: true,
});

export const getSubmarinerAddonListResourceObj = () =>
  getSubmarinerHubListResourceObj(SUBMARINER_ADDON_KIND);

export const getSubmarinerBrokerListResourceObj = () =>
  getSubmarinerHubListResourceObj(SUBMARINER_BROKER_KIND);

export const getSubmarinerClusterListResourceObj = () =>
  getSubmarinerHubListResourceObj(SUBMARINER_CLUSTER_KIND);

type ClusterScopeObjectType = {
  name?: string;
  selector?: Selector;
};

type NamespacedObjectType = ClusterScopeObjectType & {
  namespace?: string;
};
