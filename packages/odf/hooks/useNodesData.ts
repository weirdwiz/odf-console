import * as React from 'react';
import { nodeResource } from '@odf/core/resources';
import { getName } from '@odf/shared';
import {
  useCustomPrometheusPoll,
  usePrometheusBasePath,
} from '@odf/shared/hooks/custom-prometheus-poll';
import {
  NodeQueries,
  allNodesUtilizationQueries,
} from '@odf/shared/queries/node';
import {
  NodeKind,
  useK8sWatchResource,
  PrometheusEndpoint,
} from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash-es';
import { NodeData } from '../types';

export const useNodesDataDependencies = {
  // SAFETY: The deps wrapper delegates to useK8sWatchResource; the cast preserves the generic signature for test spying.
  useK8sWatchResource: useK8sWatchResource as typeof useK8sWatchResource,
  useCustomPrometheusPoll,
  usePrometheusBasePath,
};

/**
 * Note: Reference of "nodesData" changes frequently due to recomputation caused by Prometheus response.
 * That is, "utilization" updates every few seconds.
 * Make sure to optimise on the consumer FC side (in case really needed or if it affects the FC's performance).
 */
export const useNodesData = (
  useOnlyWorker?: boolean,
  controlPlaneOrStretchCluster?: boolean
): [NodeData[], boolean, any] => {
  const [nodes, nodesLoaded, nodesLoadError] =
    useNodesDataDependencies.useK8sWatchResource<NodeKind[]>(nodeResource);
  const [utilization, , promLoading] =
    useNodesDataDependencies.useCustomPrometheusPoll({
      query: allNodesUtilizationQueries[NodeQueries.ALL_NODES_MEMORY_TOTAL],
      endpoint: PrometheusEndpoint.QUERY,
      basePath: useNodesDataDependencies.usePrometheusBasePath(),
    });

  const loaded = nodesLoaded && !promLoading;
  const error = nodesLoadError;

  const nodesData = React.useMemo(() => {
    let nodesData = [];
    // Fallback to node.status.capacity when prometheus is unavailable
    if (nodes && loaded && !error) {
      nodesData = nodes
        .filter(
          (node) =>
            !useOnlyWorker ||
            node.metadata.labels?.hasOwnProperty(
              'node-role.kubernetes.io/worker'
            ) ||
            (controlPlaneOrStretchCluster &&
              node.metadata.labels?.hasOwnProperty(
                'node-role.kubernetes.io/control-plane'
              ))
        )
        .map((node: Partial<NodeData>): NodeData => {
          const metric = _.find(utilization?.data?.result || [], [
            'metric.instance',
            getName(node),
          ]);
          node['metrics'] = { memory: metric ? metric.value[1] : undefined };
          // SAFETY: useNodesData returns NodeData items; the table row generic is wider.
          return node as NodeData;
        });
    }
    return nodesData;
  }, [
    nodes,
    utilization,
    loaded,
    error,
    useOnlyWorker,
    controlPlaneOrStretchCluster,
  ]);

  return [nodesData, loaded, error];
};
