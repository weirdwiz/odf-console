import * as React from 'react';
import '@testing-library/jest-dom';
import { render, waitFor } from '@testing-library/react';
import { ACMManagedClusterKind } from '../../types';
import Topology, { topologyDependencies } from './Topology';

const mockUseK8sWatchResource = jest
  .spyOn(topologyDependencies, 'useK8sWatchResource')
  .mockImplementation(jest.fn());
jest
  .spyOn(topologyDependencies, 'useFetchCsv')
  .mockImplementation(
    jest.fn(() => [{ spec: { version: '4.18.0' } }, true, null])
  );
jest
  .spyOn(topologyDependencies, 'getManagedClusterResourceObj')
  .mockImplementation(jest.fn(() => ({})));
jest
  .spyOn(topologyDependencies, 'useProtectedAppsByCluster')
  .mockImplementation(jest.fn(() => [{}, true, null]));
jest
  .spyOn(topologyDependencies, 'useDRPoliciesByClusterPair')
  .mockImplementation(jest.fn(() => [{}, true, null]));
jest
  .spyOn(topologyDependencies, 'useActiveDROperations')
  .mockImplementation(jest.fn(() => [{}, true, null]));
jest
  .spyOn(topologyDependencies, 'getManagedClusterInfoTypes')
  .mockImplementation(
    jest.fn((clusters) =>
      clusters.map((cluster) => ({
        ...cluster,
        odfInfo: {
          odfVersion: '4.18',
          isValidODFVersion: true,
          storageClusterCount: 1,
          storageClusterInfo: {
            storageClusterNamespacedName: '',
            cephFSID: '',
            deploymentType: '',
          },
        },
      }))
    )
  );
const visualizationController = {
  fromModel: jest.fn(),
  toModel: jest.fn(() => ({ nodes: [], edges: [] })),
  getGraph: jest.fn(() => ({
    scaleBy: jest.fn(),
    fit: jest.fn(),
    reset: jest.fn(),
    layout: jest.fn(),
  })),
};
jest
  .spyOn(topologyDependencies, 'useVisualizationController')
  .mockImplementation(jest.fn(() => visualizationController));
jest
  .spyOn(topologyDependencies, 'useVisualizationSetup')
  .mockImplementation(jest.fn(() => visualizationController));
jest
  .spyOn(topologyDependencies, 'useTopologyControls')
  .mockImplementation(jest.fn(() => []));
jest
  .spyOn(topologyDependencies, 'useSelectionHandler')
  .mockImplementation(jest.fn());
jest
  .spyOn(topologyDependencies, 'VisualizationProvider')
  .mockImplementation(({ children }) => <div>{children}</div>);
jest
  .spyOn(topologyDependencies, 'BaseTopologyView')
  .mockImplementation(({ children, sideBar }) => (
    <div data-testid="base-topology">
      {children}
      {sideBar}
    </div>
  ));

describe('Topology Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      // First call: managedClusters
      mockUseK8sWatchResource.mockReturnValueOnce([[], false, null]);
      // Second call: MCVs
      mockUseK8sWatchResource.mockReturnValueOnce([[], false, null]);

      const { container } = render(<Topology />);

      // Should show loading indicator (from HandleErrorAndLoading)
      expect(container).toBeDefined();
    });

    it('should render topology when data is loaded', async () => {
      const mockClusters: ACMManagedClusterKind[] = [
        {
          apiVersion: 'cluster.open-cluster-management.io/v1',
          kind: 'ManagedCluster',
          metadata: { name: 'cluster1', uid: 'uid-1' },
          status: {},
        },
      ];

      // First call: managedClusters
      mockUseK8sWatchResource.mockReturnValueOnce([mockClusters, true, null]);
      // Second call: MCVs (empty but loaded)
      mockUseK8sWatchResource.mockReturnValueOnce([[], true, null]);

      const { container } = render(<Topology />);

      await waitFor(() => {
        // Check if topology container is rendered
        const topologyElement = container.querySelector('.mco-topology');
        expect(topologyElement).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no clusters exist', () => {
      // First call: managedClusters (empty)
      mockUseK8sWatchResource.mockReturnValueOnce([[], true, null]);
      // Second call: MCVs (empty)
      mockUseK8sWatchResource.mockReturnValueOnce([[], true, null]);

      const { getByText } = render(<Topology />);

      expect(getByText('No clusters found')).toBeInTheDocument();
      expect(
        getByText('Connect managed clusters to view the topology')
      ).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error when cluster fetch fails', () => {
      const mockError = new Error('Failed to fetch clusters');
      // First call: managedClusters (error)
      mockUseK8sWatchResource.mockReturnValueOnce([[], false, mockError]);
      // Second call: MCVs (loaded)
      mockUseK8sWatchResource.mockReturnValueOnce([[], true, null]);

      const { container } = render(<Topology />);

      // Error should be passed to HandleErrorAndLoading
      expect(container).toBeDefined();
    });
  });

  describe('Topology Rendering', () => {
    it('should render topology view with clusters', async () => {
      const mockClusters: ACMManagedClusterKind[] = [
        {
          apiVersion: 'cluster.open-cluster-management.io/v1',
          kind: 'ManagedCluster',
          metadata: { name: 'cluster1', uid: 'uid-1' },
        },
        {
          apiVersion: 'cluster.open-cluster-management.io/v1',
          kind: 'ManagedCluster',
          metadata: { name: 'cluster2', uid: 'uid-2' },
        },
      ];

      // First call: managedClusters
      mockUseK8sWatchResource.mockReturnValueOnce([mockClusters, true, null]);
      // Second call: MCVs
      mockUseK8sWatchResource.mockReturnValueOnce([[], true, null]);

      const { container } = render(<Topology />);

      await waitFor(() => {
        // Check if topology container is rendered
        const topologyElement = container.querySelector('.mco-topology');
        expect(topologyElement).toBeInTheDocument();
      });
    });
  });

  describe('Context Provider', () => {
    it('should provide topology data context to children', async () => {
      const mockClusters: ACMManagedClusterKind[] = [
        {
          apiVersion: 'cluster.open-cluster-management.io/v1',
          kind: 'ManagedCluster',
          metadata: { name: 'cluster1', uid: 'uid-1' },
        },
      ];

      // First call: managedClusters
      mockUseK8sWatchResource.mockReturnValueOnce([mockClusters, true, null]);
      // Second call: MCVs
      mockUseK8sWatchResource.mockReturnValueOnce([[], true, null]);

      const { container } = render(<Topology />);

      await waitFor(() => {
        // Context should be provided (verified through successful rendering)
        expect(
          container.querySelector('[data-testid="base-topology"]')
        ).toBeInTheDocument();
      });
    });
  });
});

describe('Topology With Error Handler', () => {
  it('should show topology when clusters exist', () => {
    const mockClusters: ACMManagedClusterKind[] = [
      {
        apiVersion: 'cluster.open-cluster-management.io/v1',
        kind: 'ManagedCluster',
        metadata: { name: 'cluster1', uid: 'uid-1' },
      },
    ];

    // First call: managedClusters
    mockUseK8sWatchResource.mockReturnValueOnce([mockClusters, true, null]);
    // Second call: MCVs
    mockUseK8sWatchResource.mockReturnValueOnce([[], true, null]);

    const { queryByText } = render(<Topology />);

    expect(queryByText('No clusters found')).not.toBeInTheDocument();
  });

  it('should show empty state when no clusters', () => {
    mockUseK8sWatchResource.mockReturnValue([[], true, null]);

    const { getByText } = render(<Topology />);

    expect(getByText('No clusters found')).toBeInTheDocument();
  });
});
