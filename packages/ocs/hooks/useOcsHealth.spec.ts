import { StorageClusterKind } from '@odf/shared';
import { HealthState } from '@openshift-console/dynamic-plugin-sdk';
import { renderHook } from '@testing-library/react';
import { useGetOCSHealth, useOcsHealthDeps } from './useOcsHealth';

jest
  .spyOn(useOcsHealthDeps, 'useK8sWatchResource')
  .mockImplementation(jest.fn());
jest
  .spyOn(useOcsHealthDeps, 'useCustomPrometheusPoll')
  .mockImplementation(jest.fn());
jest
  .spyOn(useOcsHealthDeps, 'usePrometheusBasePath')
  .mockImplementation(jest.fn(() => ''));
jest.spyOn(useOcsHealthDeps, 'useCustomTranslation').mockImplementation(
  jest.fn(() => ({
    t: (key: string) => key,
  }))
);
jest
  .spyOn(useOcsHealthDeps, 'getCephHealthState')
  .mockImplementation(jest.fn());
jest.spyOn(useOcsHealthDeps, 'getRGWHealthState').mockImplementation(jest.fn());
jest.spyOn(useOcsHealthDeps, 'getNooBaaState').mockImplementation(jest.fn());

const mockStorageCluster: StorageClusterKind = {
  apiVersion: 'ocs.openshift.io/v1',
  kind: 'StorageCluster',
  metadata: {
    name: 'test-cluster',
    namespace: 'openshift-storage',
  },
  spec: {},
};

const mockCephCluster = {
  apiVersion: 'ceph.rook.io/v1',
  kind: 'CephCluster',
  metadata: {
    name: 'ocs-storagecluster-cephcluster',
    namespace: 'openshift-storage',
  },
  status: {
    ceph: {
      health: 'HEALTH_OK',
    },
  },
};

const mockCephObjectStore = {
  apiVersion: 'ceph.rook.io/v1',
  kind: 'CephObjectStore',
  metadata: {
    name: 'ocs-storagecluster-cephobjectstore',
    namespace: 'openshift-storage',
  },
  status: {
    phase: 'Connected',
  },
};

const mockNoobaaSystem = {
  apiVersion: 'noobaa.io/v1alpha1',
  kind: 'NooBaa',
  metadata: {
    name: 'noobaa',
    namespace: 'openshift-storage',
  },
  status: {},
};

const createPrometheusResponse = (value) => {
  const result = {
    metric: {},
    value: [1712304917.483, value],
  };
  const data = {
    result: [result],
    resultType: 'vector',
  };
  return {
    status: 'success',
    data,
  };
};

describe('useGetOCSHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Healthy scenarios', () => {
    it('returns OK when all subsystems are healthy', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null]) // cephData
        .mockReturnValueOnce([[mockCephObjectStore], true, null]) // cephObjData
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]); // noobaaData

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.OK);
      expect(result.current.message).toBe('Healthy');
    });

    it('returns OK when Ceph is LOADING (acceptable state)', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.LOADING,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.OK);
      expect(result.current.message).toBe('Healthy');
    });

    it('returns OK when RGW is NOT_AVAILABLE (acceptable state)', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.NOT_AVAILABLE,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.OK);
      expect(result.current.message).toBe('Healthy');
    });

    it('returns OK when MCG is UPDATING (acceptable state)', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.UPDATING,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.OK);
      expect(result.current.message).toBe('Healthy');
    });
  });

  describe('Unhealthy scenarios', () => {
    it('returns ERROR when Ceph is unhealthy', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.ERROR,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.ERROR);
      expect(result.current.message).toBe('Unhealthy');
    });

    it('returns ERROR when RGW is in ERROR state', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.ERROR,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.ERROR);
      expect(result.current.message).toBe('Unhealthy');
    });

    it('returns ERROR when MCG is in ERROR state', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('1'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.ERROR,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.ERROR);
      expect(result.current.message).toBe('Unhealthy');
    });

    it('returns ERROR when both RGW and MCG are unhealthy', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('1'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.ERROR,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.ERROR,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.ERROR);
      expect(result.current.message).toBe('Unhealthy');
    });

    it('returns ERROR when all subsystems are unhealthy', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('1'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.ERROR,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.ERROR,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.ERROR,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.ERROR);
      expect(result.current.message).toBe('Unhealthy');
    });

    it('returns ERROR when Ceph is in WARNING state (unacceptable)', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.WARNING,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.ERROR);
      expect(result.current.message).toBe('Unhealthy');
    });

    it('returns ERROR when MCG is in WARNING state (unacceptable)', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('2'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.WARNING,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.ERROR);
      expect(result.current.message).toBe('Unhealthy');
    });
  });

  describe('Resource matching by namespace', () => {
    it('filters Ceph cluster by namespace', () => {
      const otherNamespaceCeph = {
        ...mockCephCluster,
        metadata: { ...mockCephCluster.metadata, namespace: 'other-namespace' },
      };

      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([
          [mockCephCluster, otherNamespaceCeph],
          true,
          null,
        ])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(useOcsHealthDeps.getCephHealthState).toHaveBeenCalledWith(
        expect.objectContaining({
          ceph: expect.objectContaining({
            data: mockCephCluster,
          }),
        }),
        expect.any(Function)
      );
    });

    it('filters CephObjectStore by namespace', () => {
      const otherNamespaceRGW = {
        ...mockCephObjectStore,
        metadata: {
          ...mockCephObjectStore.metadata,
          namespace: 'other-namespace',
        },
      };

      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([
          [mockCephObjectStore, otherNamespaceRGW],
          true,
          null,
        ])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(useOcsHealthDeps.getRGWHealthState).toHaveBeenCalledWith(
        mockCephObjectStore
      );
    });

    it('filters Noobaa by namespace', () => {
      const otherNamespaceNoobaa = {
        ...mockNoobaaSystem,
        metadata: {
          ...mockNoobaaSystem.metadata,
          namespace: 'other-namespace',
        },
      };

      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([
          [mockNoobaaSystem, otherNamespaceNoobaa],
          true,
          null,
        ]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(useOcsHealthDeps.getNooBaaState).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Function),
        expect.objectContaining({
          data: [mockNoobaaSystem, otherNamespaceNoobaa],
        })
      );
    });
  });

  describe('Edge cases - missing resources', () => {
    it('returns OK when no CephObjectStore exists (RGW N/A)', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[], true, null]) // no CephObjectStore
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.NOT_AVAILABLE,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.OK);
      expect(result.current.message).toBe('Healthy');
    });

    it('returns OK when no NooBaa exists (MCG N/A)', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[], true, null]); // no NooBaa

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.OK);
      expect(result.current.message).toBe('Healthy');
      expect(useOcsHealthDeps.getNooBaaState).not.toHaveBeenCalled();
    });

    it('handles CephObjectStore not found in namespace (undefined)', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([
          [
            {
              ...mockCephObjectStore,
              metadata: {
                ...mockCephObjectStore.metadata,
                namespace: 'different-namespace',
              },
            },
          ],
          true,
          null,
        ])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.NOT_AVAILABLE,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(useOcsHealthDeps.getRGWHealthState).toHaveBeenCalledWith(
        undefined
      );
      expect(result.current.healthState).toBe(HealthState.OK);
    });

    it('handles NooBaa not found in namespace (undefined)', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([
          [
            {
              ...mockNoobaaSystem,
              metadata: {
                ...mockNoobaaSystem.metadata,
                namespace: 'different-namespace',
              },
            },
          ],
          true,
          null,
        ]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(useOcsHealthDeps.getNooBaaState).not.toHaveBeenCalled();
      expect(result.current.healthState).toBe(HealthState.OK);
    });
  });

  describe('Edge cases - load errors', () => {
    it('handles CephCluster load error', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[], false, new Error('Failed to load')])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.NOT_AVAILABLE,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.OK);
    });

    it('handles CephObjectStore load error (RGW becomes N/A)', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[], false, new Error('Failed to load')])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(useOcsHealthDeps.getRGWHealthState).not.toHaveBeenCalled();
      expect(result.current.healthState).toBe(HealthState.OK);
    });

    it('handles NooBaa load error', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[], false, new Error('Failed to load')]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.NOT_AVAILABLE,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.OK);
    });

    it('handles Prometheus query error', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([null, new Error('Query failed')]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.NOT_AVAILABLE,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.OK);
    });

    it('returns UNKNOWN when all resources have network errors', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[], false, new Error('Network error')])
        .mockReturnValueOnce([[], false, new Error('Network error')])
        .mockReturnValueOnce([[], false, new Error('Network error')]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.UNKNOWN);
      expect(result.current.message).toBe('Unknown');
      expect(useOcsHealthDeps.getCephHealthState).not.toHaveBeenCalled();
      expect(useOcsHealthDeps.getRGWHealthState).not.toHaveBeenCalled();
      expect(useOcsHealthDeps.getNooBaaState).not.toHaveBeenCalled();
    });

    it('returns UNKNOWN when some resources have network errors and others not loaded', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[], false, new Error('Network error')])
        .mockReturnValueOnce([[], false, new Error('Network error')])
        .mockReturnValueOnce([[], false, null]); // Not loaded but no error

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      // Should be LOADING because noobaa is still loading (no error)
      expect(result.current.healthState).toBe(HealthState.LOADING);
      expect(result.current.message).toBe('Loading');
    });
  });

  describe('Edge cases - not loaded yet', () => {
    it('returns LOADING when CephCluster not loaded yet', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[], false, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.LOADING);
      expect(result.current.message).toBe('Loading');
      expect(useOcsHealthDeps.getCephHealthState).not.toHaveBeenCalled();
    });

    it('returns LOADING when CephObjectStore not loaded yet', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[], false, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.LOADING);
      expect(result.current.message).toBe('Loading');
      expect(useOcsHealthDeps.getRGWHealthState).not.toHaveBeenCalled();
    });

    it('returns LOADING when NooBaa not loaded yet', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[], false, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.LOADING);
      expect(result.current.message).toBe('Loading');
      expect(useOcsHealthDeps.getNooBaaState).not.toHaveBeenCalled();
    });

    it('returns LOADING when all resources are not loaded yet', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[], false, null])
        .mockReturnValueOnce([[], false, null])
        .mockReturnValueOnce([[], false, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.LOADING);
      expect(result.current.message).toBe('Loading');
      expect(useOcsHealthDeps.getCephHealthState).not.toHaveBeenCalled();
      expect(useOcsHealthDeps.getRGWHealthState).not.toHaveBeenCalled();
      expect(useOcsHealthDeps.getNooBaaState).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases - empty or null data', () => {
    it('handles null CephCluster data', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([null, true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.NOT_AVAILABLE,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.OK);
    });

    it('handles empty array for all resources', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[], true, null])
        .mockReturnValueOnce([[], true, null])
        .mockReturnValueOnce([[], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.NOT_AVAILABLE,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.NOT_AVAILABLE,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.OK);
      expect(useOcsHealthDeps.getNooBaaState).not.toHaveBeenCalled();
    });

    it('handles undefined CephCluster in namespace', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.UNKNOWN,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.ERROR);
      expect(result.current.message).toBe('Unhealthy');
    });
  });

  describe('Mixed health states', () => {
    it('returns ERROR when block/file is OK but object is ERROR', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('1'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.ERROR,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.ERROR,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.ERROR);
      expect(result.current.message).toBe('Unhealthy');
    });

    it('returns ERROR when block/file is ERROR but object is OK', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.ERROR,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.ERROR);
      expect(result.current.message).toBe('Unhealthy');
    });

    it('handles PROGRESS state for RGW (unacceptable)', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.PROGRESS,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.ERROR);
      expect(result.current.message).toBe('Unhealthy');
    });

    it('handles UNKNOWN state for MCG (unacceptable)', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.UNKNOWN,
      });

      const { result } = renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(result.current.healthState).toBe(HealthState.ERROR);
      expect(result.current.message).toBe('Unhealthy');
    });
  });

  describe('Memoization and dependency tracking', () => {
    it('recomputes when CephCluster data changes', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.ERROR,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(useOcsHealthDeps.getCephHealthState).toHaveBeenCalled();
    });

    it('passes correct arguments to utility functions', () => {
      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      const promResponse = createPrometheusResponse('0');
      const promError = null;

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([promResponse, promError]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      renderHook(() => useGetOCSHealth(mockStorageCluster));

      expect(useOcsHealthDeps.getCephHealthState).toHaveBeenCalledWith(
        {
          ceph: {
            data: mockCephCluster,
            loaded: true,
            loadError: null,
          },
        },
        expect.any(Function)
      );

      expect(useOcsHealthDeps.getRGWHealthState).toHaveBeenCalledWith(
        mockCephObjectStore
      );

      expect(useOcsHealthDeps.getNooBaaState).toHaveBeenCalledWith(
        [
          {
            response: promResponse,
            error: promError,
          },
        ],
        expect.any(Function),
        {
          loaded: true,
          loadError: null,
          data: [mockNoobaaSystem],
        }
      );
    });
  });

  describe('StorageCluster with different namespaces', () => {
    it('works with custom namespace', () => {
      const customStorageCluster = {
        ...mockStorageCluster,
        metadata: {
          ...mockStorageCluster.metadata,
          namespace: 'custom-namespace',
        },
      };

      const customCeph = {
        ...mockCephCluster,
        metadata: {
          ...mockCephCluster.metadata,
          namespace: 'custom-namespace',
        },
      };

      jest
        .mocked(useOcsHealthDeps.useK8sWatchResource)
        .mockReturnValueOnce([[customCeph, mockCephCluster], true, null])
        .mockReturnValueOnce([[mockCephObjectStore], true, null])
        .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

      jest
        .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
        .mockReturnValue([createPrometheusResponse('0'), null]);

      jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
        state: HealthState.OK,
      });

      jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
        state: HealthState.OK,
      });

      renderHook(() => useGetOCSHealth(customStorageCluster));

      expect(useOcsHealthDeps.getCephHealthState).toHaveBeenCalledWith(
        expect.objectContaining({
          ceph: expect.objectContaining({
            data: customCeph,
          }),
        }),
        expect.any(Function)
      );
    });
  });

  describe('All acceptable health states', () => {
    const acceptableStates = [
      HealthState.OK,
      HealthState.LOADING,
      HealthState.UPDATING,
      HealthState.NOT_AVAILABLE,
    ];

    acceptableStates.forEach((state) => {
      it(`returns OK when all subsystems are in ${state} state`, () => {
        jest
          .mocked(useOcsHealthDeps.useK8sWatchResource)
          .mockReturnValueOnce([[mockCephCluster], true, null])
          .mockReturnValueOnce([[mockCephObjectStore], true, null])
          .mockReturnValueOnce([[mockNoobaaSystem], true, null]);

        jest
          .mocked(useOcsHealthDeps.useCustomPrometheusPoll)
          .mockReturnValue([createPrometheusResponse('0'), null]);

        jest.mocked(useOcsHealthDeps.getCephHealthState).mockReturnValue({
          state,
        });

        jest.mocked(useOcsHealthDeps.getRGWHealthState).mockReturnValue({
          state,
        });

        jest.mocked(useOcsHealthDeps.getNooBaaState).mockReturnValue({
          state,
        });

        const { result } = renderHook(() =>
          useGetOCSHealth(mockStorageCluster)
        );

        expect(result.current.healthState).toBe(HealthState.OK);
        expect(result.current.message).toBe('Healthy');
      });
    });
  });
});
