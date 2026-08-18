import { useCustomPrometheusPoll } from '@odf/shared/hooks/custom-prometheus-poll';
import * as TestDependency2 from '@odf/shared/hooks/custom-prometheus-poll';
import {
  PrometheusData,
  PrometheusResponse,
  PrometheusResult,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import * as TestDependency1 from '@openshift-console/dynamic-plugin-sdk';
import { renderHook } from '@testing-library/react';
import { createFakeNodes } from '../../../jest/helpers';
import { useNodesData } from './useNodesData';

jest
  .spyOn(TestDependency1, 'useK8sWatchResource')
  .mockImplementation(jest.fn());
jest
  .spyOn(TestDependency2, 'useCustomPrometheusPoll')
  .mockImplementation(jest.fn());
jest
  .spyOn(TestDependency2, 'usePrometheusBasePath')
  .mockImplementation(jest.fn(() => ''));

const cpu = 12;
const memory = 8 * 1000 * 1000 * 1000;
const metricMemory = 32 * 1000 * 1000 * 1000;
const getUtilizationMetrics = (
  nodeName: string,
  nodeMemory: number
): PrometheusResponse => {
  const utilizationMetrics: PrometheusResult[] = [
    {
      metric: {
        instance: nodeName,
      },
      value: [1712304917.483, String(nodeMemory)],
    },
  ];
  const promResponseData: PrometheusData = {
    result: utilizationMetrics,
    resultType: 'vector',
  };
  return {
    status: 'success',
    data: promResponseData,
  };
};

describe('useNodesData', () => {
  it('contains node memory from metrics', () => {
    const nodes = createFakeNodes(1, cpu, memory);
    jest.mocked(useK8sWatchResource).mockReturnValue([nodes, true, null]);
    const promResponse = getUtilizationMetrics('node-name-0', metricMemory);
    jest
      .mocked(useCustomPrometheusPoll)
      .mockReturnValue([promResponse, null, false]);

    const { result } = renderHook(() => useNodesData());
    const [nodesData] = result.current;
    expect(nodesData[0].metrics.memory).toEqual(String(metricMemory));
  });

  it('does not contain node memory from metrics (missing node metric)', () => {
    const nodes = createFakeNodes(1, cpu, memory);
    jest.mocked(useK8sWatchResource).mockReturnValue([nodes, true, null]);
    const promResponse = getUtilizationMetrics('nonexistent', metricMemory);
    jest
      .mocked(useCustomPrometheusPoll)
      .mockReturnValue([promResponse, null, false]);

    const { result } = renderHook(() => useNodesData());
    const [nodesData] = result.current;
    expect(nodesData[0].metrics.memory).toBeUndefined();
  });

  it('does not return nodes when prom response is not available yet', () => {
    const nodes = createFakeNodes(1, cpu, memory);
    jest.mocked(useK8sWatchResource).mockReturnValue([nodes, true, null]);
    jest.mocked(useCustomPrometheusPoll).mockReturnValue([null, null, true]);

    const { result } = renderHook(() => useNodesData());
    const [nodesData] = result.current;
    expect(nodesData).toStrictEqual([]);
  });

  it('returns nodes when prom response errors out', () => {
    const nodes = createFakeNodes(1, cpu, memory);
    jest.mocked(useK8sWatchResource).mockReturnValue([nodes, true, null]);
    jest
      .mocked(useCustomPrometheusPoll)
      .mockReturnValue([null, new Error('Bad Gateway'), false]);

    const { result } = renderHook(() => useNodesData());
    const [nodesData, loaded] = result.current;
    expect(nodesData).toHaveLength(1);
    expect(nodesData[0].metrics.memory).toBeUndefined();
    expect(loaded).toBe(true);
  });
});
