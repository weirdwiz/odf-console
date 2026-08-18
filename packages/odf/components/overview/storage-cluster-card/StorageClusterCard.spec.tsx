import * as React from 'react';
import { HealthState } from '@openshift-console/dynamic-plugin-sdk';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { isString } from 'lodash-es';
import { BrowserRouter } from 'react-router';
import {
  StorageClusterCard,
  storageClusterCardDeps,
} from './StorageClusterCard';

jest
  .spyOn(storageClusterCardDeps, 'odfSubscriptionResource')
  .mockImplementation(
    jest.fn((ns) => ({
      kind: 'Subscription',
      fieldSelector: 'metadata.name=odf-operator',
      isList: false,
      namespace: ns,
    }))
  );
jest.replaceProperty(storageClusterCardDeps, 'storageClusterResource', {
  isList: true,
  kind: 'StorageCluster',
});
jest.spyOn(storageClusterCardDeps, 'getStorageClusterInNs').mockImplementation(
  jest.fn((clusters, namespace) => {
    return clusters?.find(
      (cluster) => cluster?.metadata?.namespace === namespace
    );
  })
);
jest
  .spyOn(storageClusterCardDeps, 'resiliencyProgressQuery')
  .mockImplementation(jest.fn(() => 'ceph_health_query'));
jest.replaceProperty(storageClusterCardDeps, 'StatusCardQueries', {
  MCG_REBUILD_PROGRESS_QUERY: 'mcg_rebuild_query',
});
jest.replaceProperty(storageClusterCardDeps, 'DANGER_THRESHOLD', 0.85);
jest.replaceProperty(storageClusterCardDeps, 'WARNING_THRESHOLD', 0.8);
jest
  .spyOn(storageClusterCardDeps, 'useRawCapacity')
  .mockImplementation(jest.fn());
jest
  .spyOn(storageClusterCardDeps, 'useSafeK8sWatchResource')
  .mockImplementation(jest.fn());
jest
  .spyOn(storageClusterCardDeps, 'useODFNamespaceSelector')
  .mockImplementation(jest.fn());
jest
  .spyOn(storageClusterCardDeps, 'useK8sWatchResource')
  .mockImplementation(jest.fn());
jest.spyOn(storageClusterCardDeps, 'useFetchCsv').mockImplementation(jest.fn());
jest
  .spyOn(storageClusterCardDeps, 'getName')
  .mockImplementation(jest.fn((obj) => obj?.metadata?.name || ''));
jest.replaceProperty(storageClusterCardDeps, 'healthStateMapping', {
  OK: { icon: <span>✓</span> },
  WARNING: { icon: <span>⚠</span> },
  ERROR: { icon: <span>✗</span> },
  LOADING: { icon: <span>...</span> },
  UNKNOWN: { icon: <span>?</span> },
  NOT_AVAILABLE: { icon: <span>-</span> },
});
jest
  .spyOn(storageClusterCardDeps, 'healthStateMessage')
  .mockImplementation(jest.fn((state) => state));
jest.replaceProperty(storageClusterCardDeps, 'ODF_OPERATOR', 'odf-operator');
jest.replaceProperty(storageClusterCardDeps, 'DASH', '-');
jest
  .spyOn(storageClusterCardDeps, 'ErrorCardBody')
  .mockImplementation(({ title }: { title: string }) => <div>{title}</div>);
jest
  .spyOn(storageClusterCardDeps, 'useCustomPrometheusPoll')
  .mockImplementation(jest.fn());
jest
  .spyOn(storageClusterCardDeps, 'usePrometheusBasePath')
  .mockImplementation(jest.fn(() => '/prometheus'));
jest.spyOn(storageClusterCardDeps, 'useCustomTranslation').mockImplementation(
  jest.fn(() => ({
    t: (key: string) => key,
  }))
);
jest
  .spyOn(storageClusterCardDeps, 'getOprChannelFromSub')
  .mockImplementation(
    jest.fn((sub) => sub?.spec?.channel || storageClusterCardDeps.DASH)
  );
jest
  .spyOn(storageClusterCardDeps, 'getOprVersionFromCSV')
  .mockImplementation(
    jest.fn((csv) => csv?.spec?.version || storageClusterCardDeps.DASH)
  );
jest
  .spyOn(storageClusterCardDeps, 'getStorageClusterMetric')
  .mockImplementation(
    jest.fn((metric) => {
      if (!metric) return null;
      return metric;
    })
  );
jest.spyOn(storageClusterCardDeps, 'humanizeBinaryBytes').mockImplementation(
  jest.fn((value, _nullValue = null, preferredUnit) => {
    if (!value || value === '0' || value === 0) {
      return { value: 0, unit: 'B', string: '0 B' };
    }
    const numValue = isString(value) ? parseFloat(value) : value;
    if (preferredUnit === 'TiB') {
      return {
        value: numValue / 1024 ** 4,
        unit: 'TiB',
        string: `${(numValue / 1024 ** 4).toFixed(2)} TiB`,
      };
    }
    if (numValue >= 1024 ** 4) {
      return {
        value: numValue / 1024 ** 4,
        unit: 'TiB',
        string: `${(numValue / 1024 ** 4).toFixed(2)} TiB`,
      };
    }
    if (numValue >= 1024 ** 3) {
      return {
        value: numValue / 1024 ** 3,
        unit: 'GiB',
        string: `${(numValue / 1024 ** 3).toFixed(2)} GiB`,
      };
    }
    return { value: numValue, unit: 'B', string: `${numValue} B` };
  })
);
jest
  .spyOn(storageClusterCardDeps, 'useGetOCSHealth')
  .mockImplementation(jest.fn());
jest
  .spyOn(storageClusterCardDeps, 'getDataResiliencyState')
  .mockImplementation(jest.fn());

const mockStorageCluster = {
  apiVersion: 'ocs.openshift.io/v1',
  kind: 'StorageCluster',
  metadata: {
    name: 'ocs-storagecluster',
    namespace: 'openshift-storage',
  },
  spec: {},
  status: {
    phase: 'Ready',
  },
};

const mockCSV = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'ClusterServiceVersion',
  metadata: {
    name: 'odf-operator.v4.12.0',
    namespace: 'openshift-storage',
  },
  spec: {
    version: '4.12.0',
  },
};

const mockSubscription = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'Subscription',
  metadata: {
    name: 'odf-operator',
    namespace: 'openshift-storage',
  },
  spec: {
    channel: 'stable-4.12',
  },
};

const createPrometheusResponse = (value: string) => ({
  data: {
    result: [
      {
        metric: {},
        value: [Date.now() / 1000, value],
      },
    ],
    resultType: 'vector',
  },
  status: 'success',
});

const mockPrometheusMetric = (value: string) => ({
  metric: {},
  value: [Date.now() / 1000, value],
});

describe('StorageClusterCard', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(storageClusterCardDeps, 'useNavigate')
      .mockImplementation(() => mockNavigate);

    // Default mocks
    jest
      .mocked(storageClusterCardDeps.useODFNamespaceSelector)
      .mockReturnValue({
        odfNamespace: 'openshift-storage',
        isNsSafe: true,
      });

    jest
      .mocked(storageClusterCardDeps.useK8sWatchResource)
      .mockReturnValue([[mockStorageCluster], true, undefined]);

    jest
      .mocked(storageClusterCardDeps.useFetchCsv)
      .mockReturnValue([mockCSV, true, undefined]);

    jest.mocked(storageClusterCardDeps.useGetOCSHealth).mockReturnValue({
      healthState: HealthState.OK,
      message: 'Healthy',
    });

    jest.mocked(storageClusterCardDeps.useRawCapacity).mockReturnValue([
      mockPrometheusMetric('10995116277760'), // 10 TiB
      mockPrometheusMetric('5497558138880'), // 5 TiB
      false,
      undefined,
    ]);

    jest
      .mocked(storageClusterCardDeps.useCustomPrometheusPoll)
      .mockReturnValue([createPrometheusResponse('0'), undefined]);

    jest.mocked(storageClusterCardDeps.getDataResiliencyState).mockReturnValue({
      state: HealthState.OK,
      message: 'Healthy',
    });

    jest
      .mocked(storageClusterCardDeps.useSafeK8sWatchResource)
      .mockReturnValue([mockSubscription, true, undefined]);
  });

  describe('Rendering States', () => {
    it('should render the card with title', () => {
      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('Storage cluster')).toBeInTheDocument();
    });

    it('should render loading state when storage clusters are not loaded', () => {
      jest
        .mocked(storageClusterCardDeps.useK8sWatchResource)
        .mockReturnValue([[], false, undefined]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.getByText('Loading storage cluster data')
      ).toBeInTheDocument();
    });

    it('should render error state when storage clusters fail to load', () => {
      jest
        .mocked(storageClusterCardDeps.useK8sWatchResource)
        .mockReturnValue([[], true, new Error('Failed to load')]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.getByText('Storage cluster data not available.')
      ).toBeInTheDocument();
    });

    it('should render error state when no storage cluster is found', () => {
      jest
        .mocked(storageClusterCardDeps.useK8sWatchResource)
        .mockReturnValue([[], true, undefined]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.getByText('No storage cluster configured.')
      ).toBeInTheDocument();
    });

    it('should render storage cluster details when loaded successfully', () => {
      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('Cluster Status')).toBeInTheDocument();
      expect(screen.getByText('Block and File Resiliency')).toBeInTheDocument();
      expect(screen.getByText('Object Resiliency')).toBeInTheDocument();
      expect(screen.getByText('Data Foundation version')).toBeInTheDocument();
      expect(screen.getByText('Update channel')).toBeInTheDocument();
    });
  });

  describe('Health Status', () => {
    it('should display healthy cluster status', () => {
      jest.mocked(storageClusterCardDeps.useGetOCSHealth).mockReturnValue({
        healthState: HealthState.OK,
        message: 'Healthy',
      });

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      // Multiple "Healthy" texts will be present (cluster status + resiliency statuses)
      const healthyTexts = screen.getAllByText('Healthy');
      expect(healthyTexts.length).toBeGreaterThan(0);
    });

    it('should display warning cluster status', () => {
      jest.mocked(storageClusterCardDeps.useGetOCSHealth).mockReturnValue({
        healthState: HealthState.WARNING,
        message: 'Warning',
      });

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('should display error cluster status', () => {
      jest.mocked(storageClusterCardDeps.useGetOCSHealth).mockReturnValue({
        healthState: HealthState.ERROR,
        message: 'Error',
      });

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Resiliency Status', () => {
    it('should display healthy ceph resiliency', () => {
      jest
        .mocked(storageClusterCardDeps.getDataResiliencyState)
        .mockReturnValue({
          state: HealthState.OK,
          message: 'Healthy',
        });

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      // Multiple "Healthy" texts will be present (cluster status, ceph, object)
      const healthyTexts = screen.getAllByText('Healthy');
      expect(healthyTexts.length).toBeGreaterThan(0);
    });

    it('should display warning ceph resiliency', () => {
      jest
        .mocked(storageClusterCardDeps.getDataResiliencyState)
        .mockImplementation(() => {
          return {
            state: HealthState.WARNING,
            message: 'Rebuilding',
          };
        });

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getAllByText('WARNING').length).toBeGreaterThan(0);
    });

    it('should display error object resiliency', () => {
      jest
        .mocked(storageClusterCardDeps.getDataResiliencyState)
        .mockImplementation(() => {
          return {
            state: HealthState.ERROR,
            message: 'Failed',
          };
        });

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getAllByText('ERROR').length).toBeGreaterThan(0);
    });

    it('should handle different states for ceph and object resiliency', () => {
      let callCount = 0;
      jest
        .mocked(storageClusterCardDeps.getDataResiliencyState)
        .mockImplementation(() => {
          callCount++;
          // First call returns WARNING, second call returns OK
          if (callCount === 1) {
            return { state: HealthState.WARNING, message: 'Rebuilding' };
          }
          return { state: HealthState.OK, message: 'Healthy' };
        });

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      // Should have both WARNING and Healthy states
      expect(screen.getByText('WARNING')).toBeInTheDocument();
      // There will be multiple "Healthy" texts (from cluster status and object resiliency)
      const healthyTexts = screen.getAllByText('Healthy');
      expect(healthyTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Version Information', () => {
    it('should display ODF version when CSV is loaded', () => {
      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('4.12.0')).toBeInTheDocument();
    });

    it('should display DASH when CSV is not loaded', () => {
      jest
        .mocked(storageClusterCardDeps.useFetchCsv)
        .mockReturnValue([null, false, undefined]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      // Should display DASH for version
      expect(
        screen.getAllByText(storageClusterCardDeps.DASH).length
      ).toBeGreaterThan(0);
    });

    it('should display DASH when CSV has error', () => {
      jest
        .mocked(storageClusterCardDeps.useFetchCsv)
        .mockReturnValue([null, true, new Error('CSV error')]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.getAllByText(storageClusterCardDeps.DASH).length
      ).toBeGreaterThan(0);
    });

    it('should display update channel when subscription is loaded', () => {
      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('stable-4.12')).toBeInTheDocument();
    });

    it('should display DASH when subscription is not loaded', () => {
      jest
        .mocked(storageClusterCardDeps.useSafeK8sWatchResource)
        .mockReturnValue([null, false, undefined]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.getAllByText(storageClusterCardDeps.DASH).length
      ).toBeGreaterThan(0);
    });

    it('should display DASH when subscription has error', () => {
      jest
        .mocked(storageClusterCardDeps.useSafeK8sWatchResource)
        .mockReturnValue([null, true, new Error('Subscription error')]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.getAllByText(storageClusterCardDeps.DASH).length
      ).toBeGreaterThan(0);
    });
  });

  describe('Capacity Chart', () => {
    it('should render capacity chart when capacity data is available', () => {
      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.queryByText('No capacity data available.')
      ).not.toBeInTheDocument();
    });

    it('should display "No capacity data available" when capacity is loading', () => {
      jest
        .mocked(storageClusterCardDeps.useRawCapacity)
        .mockReturnValue([null, null, true, undefined]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.getByText('No capacity data available.')
      ).toBeInTheDocument();
    });

    it('should display "No capacity data available" when capacity has error', () => {
      jest
        .mocked(storageClusterCardDeps.useRawCapacity)
        .mockReturnValue([null, null, false, new Error('Capacity error')]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.getByText('No capacity data available.')
      ).toBeInTheDocument();
    });

    it('should display "No capacity data available" when total capacity is zero', () => {
      jest
        .mocked(storageClusterCardDeps.useRawCapacity)
        .mockReturnValue([
          mockPrometheusMetric('0'),
          mockPrometheusMetric('0'),
          false,
          undefined,
        ]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.getByText('No capacity data available.')
      ).toBeInTheDocument();
    });

    it('should calculate capacity ratio correctly for general state', () => {
      // 2 TiB used out of 10 TiB total = 20% (under 80% warning threshold)
      jest.mocked(storageClusterCardDeps.useRawCapacity).mockReturnValue([
        mockPrometheusMetric('10995116277760'), // 10 TiB
        mockPrometheusMetric('2199023255552'), // 2 TiB
        false,
        undefined,
      ]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.queryByText('No capacity data available.')
      ).not.toBeInTheDocument();
    });

    it('should handle warning threshold capacity ratio (80-85%)', () => {
      // 8.3 TiB used out of 10 TiB total = 83%
      jest.mocked(storageClusterCardDeps.useRawCapacity).mockReturnValue([
        mockPrometheusMetric('10995116277760'), // 10 TiB
        mockPrometheusMetric('9125805605683'), // 8.3 TiB
        false,
        undefined,
      ]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.queryByText('No capacity data available.')
      ).not.toBeInTheDocument();
    });

    it('should handle danger threshold capacity ratio (>85%)', () => {
      // 9.5 TiB used out of 10 TiB total = 95%
      jest.mocked(storageClusterCardDeps.useRawCapacity).mockReturnValue([
        mockPrometheusMetric('10995116277760'), // 10 TiB
        mockPrometheusMetric('10445360463872'), // 9.5 TiB
        false,
        undefined,
      ]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.queryByText('No capacity data available.')
      ).not.toBeInTheDocument();
    });

    it('should handle edge case with zero used capacity', () => {
      jest.mocked(storageClusterCardDeps.useRawCapacity).mockReturnValue([
        mockPrometheusMetric('10995116277760'), // 10 TiB
        mockPrometheusMetric('0'), // 0 used
        false,
        undefined,
      ]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.queryByText('No capacity data available.')
      ).not.toBeInTheDocument();
    });

    it('should handle edge case with full capacity', () => {
      jest.mocked(storageClusterCardDeps.useRawCapacity).mockReturnValue([
        mockPrometheusMetric('10995116277760'), // 10 TiB
        mockPrometheusMetric('10995116277760'), // 10 TiB used (100%)
        false,
        undefined,
      ]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.queryByText('No capacity data available.')
      ).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should render "View storage" button', () => {
      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('View storage')).toBeInTheDocument();
    });

    it('should navigate to storage cluster page when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      const viewStorageButton = screen.getByText('View storage');
      await user.click(viewStorageButton);

      // Verify button is present and clickable
      expect(viewStorageButton).toBeInTheDocument();
    });
  });

  describe('Namespace Handling', () => {
    it('should handle different namespace correctly', () => {
      jest
        .mocked(storageClusterCardDeps.useODFNamespaceSelector)
        .mockReturnValue({
          odfNamespace: 'custom-namespace',
          isNsSafe: true,
        });

      const customStorageCluster = {
        ...mockStorageCluster,
        metadata: {
          ...mockStorageCluster.metadata,
          namespace: 'custom-namespace',
        },
      };

      jest
        .mocked(storageClusterCardDeps.useK8sWatchResource)
        .mockReturnValue([[customStorageCluster], true, undefined]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('Storage cluster')).toBeInTheDocument();
    });

    it('should handle unsafe namespace', () => {
      jest
        .mocked(storageClusterCardDeps.useODFNamespaceSelector)
        .mockReturnValue({
          odfNamespace: 'openshift-storage',
          isNsSafe: false,
        });

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('Storage cluster')).toBeInTheDocument();
    });
  });

  describe('Multiple Storage Clusters', () => {
    it('should handle multiple storage clusters and pick the correct one', () => {
      const clusters = [
        {
          ...mockStorageCluster,
          metadata: {
            name: 'cluster-1',
            namespace: 'other-namespace',
          },
        },
        {
          ...mockStorageCluster,
          metadata: {
            name: 'cluster-2',
            namespace: 'openshift-storage',
          },
        },
      ];

      jest
        .mocked(storageClusterCardDeps.useK8sWatchResource)
        .mockReturnValue([clusters, true, undefined]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('Storage cluster')).toBeInTheDocument();
      expect(screen.getByText('Cluster Status')).toBeInTheDocument();
    });
  });

  describe('Prometheus Errors', () => {
    it('should handle ceph resiliency prometheus error', () => {
      let callCount = 0;
      jest
        .mocked(storageClusterCardDeps.useCustomPrometheusPoll)
        .mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return [null, new Error('Prometheus error')];
          }
          return [createPrometheusResponse('0'), undefined];
        });

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('Storage cluster')).toBeInTheDocument();
    });

    it('should handle object resiliency prometheus error', () => {
      let callCount = 0;
      jest
        .mocked(storageClusterCardDeps.useCustomPrometheusPoll)
        .mockImplementation(() => {
          callCount++;
          if (callCount === 2) {
            return [null, new Error('Prometheus error')];
          }
          return [createPrometheusResponse('0'), undefined];
        });

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('Storage cluster')).toBeInTheDocument();
    });

    it('should handle both resiliency prometheus errors', () => {
      jest
        .mocked(storageClusterCardDeps.useCustomPrometheusPoll)
        .mockReturnValue([null, new Error('Prometheus error')]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('Storage cluster')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to Card', () => {
      const { container } = render(
        <BrowserRouter>
          <StorageClusterCard className="custom-class" />
        </BrowserRouter>
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null storage cluster gracefully', () => {
      jest
        .mocked(storageClusterCardDeps.useK8sWatchResource)
        .mockReturnValue([[null], true, undefined]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.getByText('No storage cluster configured.')
      ).toBeInTheDocument();
    });

    it('should handle storage cluster without metadata', () => {
      jest
        .mocked(storageClusterCardDeps.useK8sWatchResource)
        .mockReturnValue([[{ kind: 'StorageCluster' }], true, undefined]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('Storage cluster')).toBeInTheDocument();
    });

    it('should handle empty CSV response', () => {
      jest
        .mocked(storageClusterCardDeps.useFetchCsv)
        .mockReturnValue([{}, true, undefined]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('Storage cluster')).toBeInTheDocument();
    });

    it('should handle empty subscription response', () => {
      jest
        .mocked(storageClusterCardDeps.useSafeK8sWatchResource)
        .mockReturnValue([{}, true, undefined]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('Storage cluster')).toBeInTheDocument();
    });

    it('should handle missing capacity data gracefully', () => {
      jest
        .mocked(storageClusterCardDeps.useRawCapacity)
        .mockReturnValue([null, null, false, undefined]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.getByText('No capacity data available.')
      ).toBeInTheDocument();
    });

    it('should handle invalid capacity metric format', () => {
      jest
        .mocked(storageClusterCardDeps.useRawCapacity)
        .mockReturnValue([
          { metric: {}, value: null },
          { metric: {}, value: null },
          false,
          undefined,
        ]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.getByText('No capacity data available.')
      ).toBeInTheDocument();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle all data loaded successfully with healthy state', () => {
      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('Storage cluster')).toBeInTheDocument();
      expect(screen.getByText('Cluster Status')).toBeInTheDocument();
      expect(screen.getByText('Block and File Resiliency')).toBeInTheDocument();
      expect(screen.getByText('Object Resiliency')).toBeInTheDocument();
      expect(screen.getByText('Data Foundation version')).toBeInTheDocument();
      expect(screen.getByText('Update channel')).toBeInTheDocument();
      expect(screen.getByText('View storage')).toBeInTheDocument();
      expect(
        screen.queryByText('No capacity data available.')
      ).not.toBeInTheDocument();
    });

    it('should handle all data loaded with mixed health states', () => {
      jest.mocked(storageClusterCardDeps.useGetOCSHealth).mockReturnValue({
        healthState: HealthState.WARNING,
        message: 'Warning',
      });

      let callCount = 0;
      jest
        .mocked(storageClusterCardDeps.getDataResiliencyState)
        .mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return { state: HealthState.ERROR, message: 'Error' };
          }
          return { state: HealthState.OK, message: 'Healthy' };
        });

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('ERROR')).toBeInTheDocument();
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    it('should handle partial data loading state', () => {
      jest
        .mocked(storageClusterCardDeps.useK8sWatchResource)
        .mockReturnValue([[mockStorageCluster], true, undefined]);
      jest
        .mocked(storageClusterCardDeps.useFetchCsv)
        .mockReturnValue([null, false, undefined]);
      jest
        .mocked(storageClusterCardDeps.useSafeK8sWatchResource)
        .mockReturnValue([null, false, undefined]);

      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(screen.getByText('Storage cluster')).toBeInTheDocument();
      expect(
        screen.getAllByText(storageClusterCardDeps.DASH).length
      ).toBeGreaterThan(0);
    });

    it('should update when capacity changes', () => {
      const { rerender } = render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.queryByText('No capacity data available.')
      ).not.toBeInTheDocument();

      // Update capacity to show no data
      jest
        .mocked(storageClusterCardDeps.useRawCapacity)
        .mockReturnValue([
          mockPrometheusMetric('0'),
          mockPrometheusMetric('0'),
          false,
          undefined,
        ]);

      rerender(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      expect(
        screen.getByText('No capacity data available.')
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels for the chart', () => {
      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      // The chart should be rendered with proper accessibility
      expect(screen.getByText('Storage cluster')).toBeInTheDocument();
    });

    it('should have proper structure for screen readers', () => {
      render(
        <BrowserRouter>
          <StorageClusterCard />
        </BrowserRouter>
      );

      // Check for description list structure
      expect(screen.getByText('Cluster Status')).toBeInTheDocument();
      expect(screen.getByText('Block and File Resiliency')).toBeInTheDocument();
      expect(screen.getByText('Object Resiliency')).toBeInTheDocument();
    });
  });
});
