import { DeploymentKind, NodeCondition, NodeKind } from '@odf/shared/types';
import { TFunction } from 'i18next';
import * as _ from 'lodash-es';
import { NodeStatus } from '@patternfly/react-topology';

const isNodeReady = (node: NodeKind): boolean => {
  const conditions = node?.status?.conditions || [];
  // SAFETY: _.find with an object predicate returns T | undefined;
  // conditions is NodeCondition[], so the found element is NodeCondition.
  const readyState = _.find(conditions, { type: 'Ready' }) as NodeCondition;

  return readyState && readyState.status === 'True';
};

const enum Condition {
  DISK_PRESSURE = 'DiskPressure',
  PID_PRESSURE = 'PIDPressure',
  MEM_PRESSURE = 'MemoryPressure',
}

const isMonitoredCondition = (condition: Condition): boolean =>
  [
    Condition.DISK_PRESSURE,
    Condition.MEM_PRESSURE,
    Condition.PID_PRESSURE,
  ].includes(condition);

const getDegradedStates = (node: NodeKind): Condition[] => {
  return node?.status?.conditions
    ?.filter(
      ({ status, type }) =>
        // SAFETY: NodeCondition.type is string; Condition enum uses a
        // subset of those strings, so the cast is safe for the check.
        status === 'True' && isMonitoredCondition(type as Condition)
    )
    .map(
      // SAFETY: After filtering by isMonitoredCondition, type is a Condition.
      ({ type }) => type as Condition
    );
};

export const getNodeStatusWithDescriptors = (
  node: NodeKind,
  deployments: DeploymentKind[],
  t: TFunction
) => {
  // Check node is ready and no pressure in node
  const isDegraded: boolean = getDegradedStates(node)?.length > 0;
  const isNodeUp: boolean = isNodeReady(node);

  const nonAvailableDeployments = deployments?.filter((deployment) => {
    const deploymentAvailabilityCondition =
      deployment?.status?.conditions?.find(
        (condition) => condition.type === 'Available'
      )?.status;
    return deploymentAvailabilityCondition !== 'True';
  });

  if (isDegraded || !isNodeUp) {
    return { status: NodeStatus.danger, message: t('Node is degraded') };
  }
  if (nonAvailableDeployments.length > 0) {
    return {
      status: NodeStatus.warning,
      message: t('Node has unavailable deployments'),
    };
  }
  return { status: NodeStatus.success, message: '' };
};

// SAFETY: Identity function cast to TFunction; TFunction has overloads that
// a plain (key: string) => string does not satisfy, requiring the cast.
const noopTranslate: TFunction = ((key: string) => key) as TFunction;

export const getNodeStatus = (
  node: NodeKind,
  deployments: DeploymentKind[]
): NodeStatus =>
  getNodeStatusWithDescriptors(node, deployments, noopTranslate).status;
