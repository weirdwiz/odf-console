import { renderHook } from '@testing-library/react';
import { ProtectedApplicationViewKind } from '../types/pav';
import {
  protectedAppsByClusterDependencies,
  useProtectedAppsByCluster,
} from './useProtectedAppsByCluster';

const mockUseK8sWatchResource = jest.spyOn(
  protectedAppsByClusterDependencies,
  'useK8sWatchResource'
);

describe('useProtectedAppsByCluster', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading States', () => {
    it('should return loading state initially', () => {
      mockUseK8sWatchResource.mockReturnValue([[], false, null]);

      const { result } = renderHook(() => useProtectedAppsByCluster());

      const [clusterAppsMap, loaded, error] = result.current;
      expect(loaded).toBe(false);
      expect(clusterAppsMap).toEqual({});
      expect(error).toBeNull();
    });

    it('should return loaded state when data arrives', () => {
      const mockPAVs: ProtectedApplicationViewKind[] = [
        {
          apiVersion: 'multicluster.odf.openshift.io/v1alpha1',
          kind: 'ProtectedApplicationView',
          metadata: { name: 'pav1', namespace: 'ns1' },
          spec: { drpcRef: { name: 'drpc1' } },
          status: {
            drInfo: { drpolicyRef: { name: 'policy1' } },
            placementInfo: {
              placementRef: {},
              selectedClusters: ['cluster1'],
            },
          },
        },
      ];

      mockUseK8sWatchResource.mockReturnValue([mockPAVs, true, null]);

      const { result } = renderHook(() => useProtectedAppsByCluster());

      const [, loaded] = result.current;
      expect(loaded).toBe(true);
    });

    it('should return error when watch fails', () => {
      const mockError = new Error('Watch failed');
      mockUseK8sWatchResource.mockReturnValue([[], false, mockError]);

      const { result } = renderHook(() => useProtectedAppsByCluster());

      const [, , error] = result.current;
      expect(error).toBe(mockError);
    });
  });

  describe('Data Grouping', () => {
    it('should group apps by cluster name using selectedClusters', () => {
      const mockPAVs: ProtectedApplicationViewKind[] = [
        {
          apiVersion: 'multicluster.odf.openshift.io/v1alpha1',
          kind: 'ProtectedApplicationView',
          metadata: { name: 'pav1', namespace: 'ns1' },
          spec: {
            drpcRef: { name: 'drpc1' },
          },
          status: {
            drInfo: {
              drpolicyRef: { name: 'policy1' },
            },
            placementInfo: {
              placementRef: {},
              selectedClusters: ['cluster1'],
            },
          },
        },
        {
          apiVersion: 'multicluster.odf.openshift.io/v1alpha1',
          kind: 'ProtectedApplicationView',
          metadata: { name: 'pav2', namespace: 'ns2' },
          spec: {
            drpcRef: { name: 'drpc2' },
          },
          status: {
            drInfo: {
              drpolicyRef: { name: 'policy1' },
            },
            placementInfo: {
              placementRef: {},
              selectedClusters: ['cluster2'],
            },
          },
        },
      ];

      mockUseK8sWatchResource.mockReturnValue([mockPAVs, true, null]);

      const { result } = renderHook(() => useProtectedAppsByCluster());

      const [clusterAppsMap] = result.current;
      expect(clusterAppsMap['cluster1']).toHaveLength(1);
      expect(clusterAppsMap['cluster2']).toHaveLength(1);
      expect(clusterAppsMap['cluster1'][0].name).toBe('pav1');
      expect(clusterAppsMap['cluster2'][0].name).toBe('pav2');
    });

    it('should group multiple apps for same cluster', () => {
      const mockPAVs: ProtectedApplicationViewKind[] = [
        {
          apiVersion: 'multicluster.odf.openshift.io/v1alpha1',
          kind: 'ProtectedApplicationView',
          metadata: { name: 'pav1', namespace: 'ns1' },
          spec: {
            drpcRef: { name: 'drpc1' },
          },
          status: {
            drInfo: {
              drpolicyRef: { name: 'policy1' },
            },
            placementInfo: {
              placementRef: {},
              selectedClusters: ['cluster1'],
            },
          },
        },
        {
          apiVersion: 'multicluster.odf.openshift.io/v1alpha1',
          kind: 'ProtectedApplicationView',
          metadata: { name: 'pav2', namespace: 'ns2' },
          spec: {
            drpcRef: { name: 'drpc2' },
          },
          status: {
            drInfo: {
              drpolicyRef: { name: 'policy1' },
            },
            placementInfo: {
              placementRef: {},
              selectedClusters: ['cluster1'],
            },
          },
        },
      ];

      mockUseK8sWatchResource.mockReturnValue([mockPAVs, true, null]);

      const { result } = renderHook(() => useProtectedAppsByCluster());

      const [clusterAppsMap] = result.current;
      expect(clusterAppsMap['cluster1']).toHaveLength(2);
      expect(clusterAppsMap['cluster1'].map((a) => a.name)).toEqual([
        'pav1',
        'pav2',
      ]);
    });

    it('should fall back to primaryCluster when selectedClusters is not available', () => {
      const mockPAVs: ProtectedApplicationViewKind[] = [
        {
          apiVersion: 'multicluster.odf.openshift.io/v1alpha1',
          kind: 'ProtectedApplicationView',
          metadata: { name: 'tester', namespace: 'openshift-dr-ops' },
          spec: {
            drpcRef: { name: 'tester' },
          },
          status: {
            drInfo: {
              drpolicyRef: { name: 'test' },
              primaryCluster: 'client-1', // App is running on client-1
              drClusters: ['client-1', 'client-2'], // Both clusters in DR policy
            },
            placementInfo: {
              placementRef: {},
              // selectedClusters is missing/undefined
            },
          },
        },
      ];

      mockUseK8sWatchResource.mockReturnValue([mockPAVs, true, null]);

      const { result } = renderHook(() => useProtectedAppsByCluster());

      const [clusterAppsMap] = result.current;
      // Should only appear on primary cluster, not both DR clusters
      expect(clusterAppsMap['client-1']).toHaveLength(1);
      expect(clusterAppsMap['client-2']).toBeUndefined();
      expect(clusterAppsMap['client-1'][0].name).toBe('tester');
    });

    it('should fall back to first drCluster when both selectedClusters and primaryCluster are not available', () => {
      const mockPAVs: ProtectedApplicationViewKind[] = [
        {
          apiVersion: 'multicluster.odf.openshift.io/v1alpha1',
          kind: 'ProtectedApplicationView',
          metadata: { name: 'tester', namespace: 'openshift-dr-ops' },
          spec: {
            drpcRef: { name: 'tester' },
          },
          status: {
            drInfo: {
              drpolicyRef: { name: 'test' },
              // primaryCluster is not set (app is initializing)
              drClusters: ['client-1', 'client-2'], // Both clusters in DR policy
            },
            placementInfo: {
              placementRef: {},
              // selectedClusters is missing/undefined
            },
          },
        },
      ];

      mockUseK8sWatchResource.mockReturnValue([mockPAVs, true, null]);

      const { result } = renderHook(() => useProtectedAppsByCluster());

      const [clusterAppsMap] = result.current;
      // Should appear on first drCluster only (not both)
      expect(clusterAppsMap['client-1']).toHaveLength(1);
      expect(clusterAppsMap['client-2']).toBeUndefined();
      expect(clusterAppsMap['client-1'][0].name).toBe('tester');
    });
  });

  describe('Filtering', () => {
    it('should filter out apps without DR policy', () => {
      const mockPAVs: ProtectedApplicationViewKind[] = [
        {
          apiVersion: 'multicluster.odf.openshift.io/v1alpha1',
          kind: 'ProtectedApplicationView',
          metadata: { name: 'pav1', namespace: 'ns1' },
          spec: {
            drpcRef: { name: 'drpc1' },
          },
          status: {
            drInfo: {
              drpolicyRef: { name: 'policy1' },
            },
            placementInfo: {
              placementRef: {},
              selectedClusters: ['cluster1'],
            },
          },
        },
        {
          apiVersion: 'multicluster.odf.openshift.io/v1alpha1',
          kind: 'ProtectedApplicationView',
          metadata: { name: 'pav2', namespace: 'ns2' },
          spec: {
            drpcRef: { name: 'drpc2' },
          },
          status: {
            drInfo: {
              // Missing drpolicyRef - no DR policy
            },
            placementInfo: {
              placementRef: {},
              selectedClusters: ['cluster1'],
            },
          },
        },
      ];

      mockUseK8sWatchResource.mockReturnValue([mockPAVs, true, null]);

      const { result } = renderHook(() => useProtectedAppsByCluster());

      const [clusterAppsMap] = result.current;
      expect(clusterAppsMap['cluster1']).toHaveLength(1);
      expect(clusterAppsMap['cluster1'][0].name).toBe('pav1');
    });

    it('should handle apps with multiple selected clusters', () => {
      const mockPAVs: ProtectedApplicationViewKind[] = [
        {
          apiVersion: 'multicluster.odf.openshift.io/v1alpha1',
          kind: 'ProtectedApplicationView',
          metadata: { name: 'pav1', namespace: 'ns1' },
          spec: {
            drpcRef: { name: 'drpc1' },
          },
          status: {
            drInfo: {
              drpolicyRef: { name: 'policy1' },
            },
            placementInfo: {
              placementRef: {},
              selectedClusters: ['cluster1', 'cluster2'], // Multiple clusters
            },
          },
        },
      ];

      mockUseK8sWatchResource.mockReturnValue([mockPAVs, true, null]);

      const { result } = renderHook(() => useProtectedAppsByCluster());

      const [clusterAppsMap] = result.current;
      // App should appear in both clusters
      expect(clusterAppsMap['cluster1']).toHaveLength(1);
      expect(clusterAppsMap['cluster2']).toHaveLength(1);
      expect(clusterAppsMap['cluster1'][0].name).toBe('pav1');
      expect(clusterAppsMap['cluster2'][0].name).toBe('pav1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty PAV list', () => {
      mockUseK8sWatchResource.mockReturnValue([[], true, null]);

      const { result } = renderHook(() => useProtectedAppsByCluster());

      const [clusterAppsMap] = result.current;
      expect(clusterAppsMap).toEqual({});
    });

    it('should handle PAVs with missing selectedClusters and primaryCluster', () => {
      const mockPAVs: ProtectedApplicationViewKind[] = [
        {
          apiVersion: 'multicluster.odf.openshift.io/v1alpha1',
          kind: 'ProtectedApplicationView',
          metadata: { name: 'pav1', namespace: 'ns1' },
          spec: {
            drpcRef: { name: 'drpc1' },
          },
          status: {
            drInfo: {
              drpolicyRef: { name: 'policy1' },
              // primaryCluster is missing
            },
            placementInfo: {
              placementRef: {},
              // selectedClusters is missing
            },
          },
        },
      ];

      mockUseK8sWatchResource.mockReturnValue([mockPAVs, true, null]);

      const { result } = renderHook(() => useProtectedAppsByCluster());

      const [clusterAppsMap] = result.current;
      expect(clusterAppsMap).toEqual({});
    });

    it('should handle PAVs with empty selectedClusters array', () => {
      const mockPAVs: ProtectedApplicationViewKind[] = [
        {
          apiVersion: 'multicluster.odf.openshift.io/v1alpha1',
          kind: 'ProtectedApplicationView',
          metadata: { name: 'pav1', namespace: 'ns1' },
          spec: {
            drpcRef: { name: 'drpc1' },
          },
          status: {
            drInfo: {
              drpolicyRef: { name: 'policy1' },
            },
            placementInfo: {
              placementRef: {},
              selectedClusters: [], // Empty
            },
          },
        },
      ];

      mockUseK8sWatchResource.mockReturnValue([mockPAVs, true, null]);

      const { result } = renderHook(() => useProtectedAppsByCluster());

      const [clusterAppsMap] = result.current;
      expect(clusterAppsMap).toEqual({});
    });
  });

  describe('App Data Structure', () => {
    it('should include all required app fields', () => {
      const mockPAVs: ProtectedApplicationViewKind[] = [
        {
          apiVersion: 'multicluster.odf.openshift.io/v1alpha1',
          kind: 'ProtectedApplicationView',
          metadata: { name: 'my-app', namespace: 'app-namespace' },
          spec: {
            drpcRef: { name: 'my-app-drpc' },
          },
          status: {
            drInfo: {
              drpolicyRef: { name: 'dr-policy-1' },
              status: {
                phase: 'FailedOver',
              },
            },
            placementInfo: {
              placementRef: {},
              selectedClusters: ['cluster1'],
            },
          },
        },
      ];

      mockUseK8sWatchResource.mockReturnValue([mockPAVs, true, null]);

      const { result } = renderHook(() => useProtectedAppsByCluster());

      const [clusterAppsMap] = result.current;
      const app = clusterAppsMap['cluster1'][0];

      expect(app.name).toBe('my-app');
      expect(app.namespace).toBe('app-namespace');
      expect(app.drPolicy).toBe('dr-policy-1');
      expect(app.status).toBe('FailedOver');
    });
  });
});
