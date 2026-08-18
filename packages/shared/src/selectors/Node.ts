import * as _ from 'lodash-es';
import { NodeCondition, NodeKind } from '../types';

export const isNodeReady = (node: NodeKind): boolean => {
  const conditions = _.get(node, 'status.conditions', []);
  // SAFETY: _.find with an object predicate returns T | undefined;
  // conditions is NodeCondition[], so the found element is NodeCondition.
  const readyState = _.find(conditions, { type: 'Ready' }) as NodeCondition;

  return readyState && readyState.status === 'True';
};
