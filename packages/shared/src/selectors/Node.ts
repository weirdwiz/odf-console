import * as _ from 'lodash-es';
import { NodeCondition, NodeKind } from '../types';

export const isNodeReady = (node: NodeKind): boolean => {
  const conditions = _.get(node, 'status.conditions', []);
  // SAFETY: _.find(conditions, { type: 'Ready' }) comes from the owner of the NodeCondition contract used at this boundary.
  const readyState = _.find(conditions, { type: 'Ready' }) as NodeCondition;

  return readyState && readyState.status === 'True';
};
