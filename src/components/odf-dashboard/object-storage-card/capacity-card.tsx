import * as React from 'react';
import { PrometheusResponse } from 'badhikar-dynamic-plugin-sdk';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
  usePrometheusPoll,
} from 'badhikar-dynamic-plugin-sdk/internalAPI';
import { humanizeBinaryBytes } from '../../../humanize';
import CapacityCard from '../../common/capacity-card/capacity-card';
import { CAPACITY_QUERIES, StorageDashboard } from '../queries';

const parseMetricData = (metric: PrometheusResponse) =>
  metric.data.result.map((datum) => ({
    name: datum.metric.type,
    usedValue: humanizeBinaryBytes(datum.value[1]),
  }));

const ObjectCapacityCard: React.FC = () => {
  const [data, error, loaded] = usePrometheusPoll({
    query: CAPACITY_QUERIES[StorageDashboard.USED_CAPACITY_OBJECT],
    endpoint: 'api/v1/query' as any,
  });

  const dataFrames = !loaded && !error ? parseMetricData(data) : [];

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>
          External Object Provider Used Capacity
        </DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <CapacityCard data={dataFrames} relative isPercentage={false} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default ObjectCapacityCard;