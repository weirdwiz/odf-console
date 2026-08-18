import {
  useCustomPrometheusPoll,
  usePrometheusBasePath,
} from '@odf/shared/hooks/custom-prometheus-poll';
import { PrometheusResponse } from '@openshift-console/dynamic-plugin-sdk';
import { CAPACITY_INFO_QUERIES, StorageDashboardQuery } from '../queries';

/**
 * Returns the total & used raw capacity of a cluster.
 */
export const useRawCapacity = (
  clusterName: string
): [PrometheusResponse, PrometheusResponse, boolean, any] => {
  // SAFETY: The receiving library accepts 'api/v1/query'; its published type does not expose this supported value.
  const [totalCapacity, totalError, totalLoading] = useCustomPrometheusPoll({
    query:
      CAPACITY_INFO_QUERIES(clusterName)[
        StorageDashboardQuery.RAW_CAPACITY_TOTAL
      ],
    endpoint: 'api/v1/query' as any,
    basePath: usePrometheusBasePath(),
  });
  // SAFETY: The receiving library accepts 'api/v1/query'; its published type does not expose this supported value.
  const [usedCapacity, usedError, usedLoading] = useCustomPrometheusPoll({
    query:
      CAPACITY_INFO_QUERIES(clusterName)[
        StorageDashboardQuery.RAW_CAPACITY_USED
      ],
    endpoint: 'api/v1/query' as any,
    basePath: usePrometheusBasePath(),
  });

  const loading = usedLoading || totalLoading;
  const loadError = totalError || usedError;

  return [totalCapacity, usedCapacity, loading, loadError];
};
