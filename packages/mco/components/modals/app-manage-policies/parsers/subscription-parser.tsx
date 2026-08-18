import * as React from 'react';
import { DRApplication, HUB_CLUSTER_NAME } from '@odf/mco/constants';
import {
  DisasterRecoveryResourceKind,
  useSubscriptionResourceWatch,
  useDisasterRecoveryResourceWatch,
  getPlacementResourceObj,
  getPlacementDecisionsResourceObj,
  getSubscriptionResourceObj,
  getPlacementRuleResourceObj,
  getApplicationResourceObj,
} from '@odf/mco/hooks';
import { DRPolicyKind } from '@odf/mco/types';
import { findDeploymentClusters } from '@odf/mco/utils';
import { ApplicationModel, getName, getNamespace } from '@odf/shared';
import { ApplicationKind } from '@odf/shared/types';
import * as _ from 'lodash-es';
import { ModalContextViewer } from '../modal-context-viewer';
import {
  generateApplicationInfo,
  generateDRPlacementControlInfo,
  generateDRInfo,
  generatePlacementInfo,
  getMatchingDRPolicies,
  getDRResources,
} from '../utils/parser-utils';
import { ModalViewContext } from '../utils/reducer';
import {
  ApplicationInfoType,
  DRPlacementControlType,
  DRPolicyType,
  ModalType,
  PlacementType,
  PVCQueryFilter,
} from '../utils/types';

export const subscriptionManageParserDependencies = {
  useDisasterRecoveryResourceWatch,
  useSubscriptionResourceWatch,
};

export const getSubscriptionResources = (
  appResource: ApplicationKind,
  namespace: string,
  drResources: DisasterRecoveryResourceKind,
  drLoaded: boolean,
  drLoadError: any,
  subscriptionName: string,
  isWatchApplication: boolean
) => ({
  resources: (() => {
    const value = {
      subscriptions: getSubscriptionResourceObj(
        (() => {
          const value = { namespace };
          if (!!subscriptionName)
            Object.assign(value, { name: subscriptionName });
          return value;
        })()
      ),
      placementRules: getPlacementRuleResourceObj({
        namespace,
      }),
      placements: getPlacementResourceObj({
        namespace,
      }),
      placementDecisions: getPlacementDecisionsResourceObj({
        namespace,
      }),
    };
    if (isWatchApplication)
      Object.assign(value, {
        applications: getApplicationResourceObj({
          name: getName(appResource),
          namespace,
        }),
      });
    return value;
  })(),
  drResources: {
    data: drResources,
    loaded: drLoaded,
    loadError: drLoadError,
  },
  overrides: (() => {
    const value = {};
    if (!isWatchApplication)
      Object.assign(value, {
        applications: {
          data: appResource,
          loaded: true,
          loadError: '',
        },
      });
    return value;
  })(),
});

export const SubscriptionParser: React.FC<SubscriptionParserProps> = ({
  application,
  subscriptionName,
  isWatchApplication,
  pvcQueryFilter,
  setCurrentModalContext,
  modalType,
}) => {
  const namespace = getNamespace(application);
  const [drResources, drLoaded, drLoadError] =
    subscriptionManageParserDependencies.useDisasterRecoveryResourceWatch(
    getDRResources(namespace)
  );
  const [subscriptionResourceList, loaded, loadError] =
    subscriptionManageParserDependencies.useSubscriptionResourceWatch(
      getSubscriptionResources(
        application,
        namespace,
        drResources,
        drLoaded,
        drLoadError,
        subscriptionName,
        isWatchApplication
      )
    );
  const subscriptionResources = subscriptionResourceList?.[0];
  const { drPolicies } = drResources;
  const applicationInfo: ApplicationInfoType = React.useMemo(() => {
    let applicationInfo: ApplicationInfoType;
    if (loaded && !loadError) {
      const app = subscriptionResources.application;
      const unProtectedPlacements: PlacementType[] = [];
      const drPlacementControls: DRPlacementControlType[] = [];
      let drPolicyInfo: DRPolicyKind = {};
      subscriptionResources?.subscriptionGroupInfo?.forEach(
        ({ placement, placementDecision, drInfo }) => {
          const { drPlacementControl, drPolicy } = drInfo || {};
          const deploymentClusters: string[] = findDeploymentClusters(
            placementDecision,
            drPlacementControl
          );
          const placementInfo = generatePlacementInfo(
            placement,
            deploymentClusters
          );
          if (_.isEmpty(drPlacementControl)) {
            // Unprotected placement
            unProtectedPlacements.push(placementInfo);
          } else {
            // Protected placement
            drPlacementControls.push(
              ...generateDRPlacementControlInfo(
                drPlacementControl,
                placementInfo
              )
            );
            // DRPolicy will be same for all subscription groups, its ok to override
            drPolicyInfo = drPolicy;
          }
        }
      );
      applicationInfo = generateApplicationInfo(
        DRApplication.SUBSCRIPTION,
        app,
        namespace,
        unProtectedPlacements,
        generateDRInfo(drPolicyInfo, drPlacementControls),
        pvcQueryFilter || [
          {
            property: 'name',
            values: [getName(app)],
          },
          {
            property: 'kind',
            values: ApplicationModel.kind,
          },
          {
            property: 'apigroup',
            values: ApplicationModel.apiGroup,
          },
          {
            property: 'namespace',
            values: namespace,
          },
          {
            property: 'cluster',
            values: HUB_CLUSTER_NAME,
          },
        ]
      );
    }
    return applicationInfo;
  }, [subscriptionResources, namespace, loaded, loadError, pvcQueryFilter]);

  const matchingPolicies: DRPolicyType[] = React.useMemo(
    () =>
      !_.isEmpty(applicationInfo)
        ? getMatchingDRPolicies(applicationInfo, drPolicies)
        : [],
    [applicationInfo, drPolicies]
  );

  return (
    <ModalContextViewer
      applicationInfo={applicationInfo}
      matchingPolicies={matchingPolicies}
      loaded={loaded}
      loadError={loadError}
      setCurrentModalContext={setCurrentModalContext}
      modalType={modalType ?? ModalType.Application}
    />
  );
};

type SubscriptionParserProps = {
  // Application resource
  application: ApplicationKind;
  // Always watch the application resource
  isWatchApplication?: boolean;
  // Subscription name
  subscriptionName?: string;
  // Current active modal context
  setCurrentModalContext: React.Dispatch<
    React.SetStateAction<ModalViewContext>
  >;
  // ACM search api PVC query filter
  pvcQueryFilter?: PVCQueryFilter;
  modalType?: ModalType;
};
