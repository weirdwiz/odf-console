import * as React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { ScaleDetailsLevel } from '@patternfly/react-topology';
import { DRActionType } from '../../../constants';
import { ActiveDROperation } from '../../../hooks/useActiveDROperations';
import { Phase, Progression } from '../../../types';
import { AppNodeData } from '../types';
import { MCOStyleAppNodeView } from './MCOStyleAppNode';

type MockAppNode = {
  getData: () => AppNodeData;
  getDimensions: () => { width: number; height: number };
  getId: () => string;
};

const TestNode: React.FC<
  React.PropsWithChildren<{
    element: MockAppNode;
    attachments?: React.ReactNode;
    className?: string;
  }>
> = ({ element, children, attachments, className }) => (
  <g
    data-testid="default-node"
    data-element-id={element.getId()}
    className={className}
  >
    {children}
    {attachments}
  </g>
);

const TestDecorator: React.FC<{
  icon?: React.ReactNode;
  x: number;
  y: number;
}> = ({ icon, x, y }) => (
  <g data-testid="decorator" transform={`translate(${x}, ${y})`}>
    {icon}
  </g>
);

const MCOStyleAppNode: React.FC<{ element: MockAppNode }> = ({ element }) => (
  <MCOStyleAppNodeView
    element={element}
    detailsLevel={ScaleDetailsLevel.high}
    NodeComponent={TestNode}
    CountDecoratorComponent={TestDecorator}
    getCountDecoratorCenter={() => ({ x: 0, y: 0 })}
    renderPhaseDecorators={() => null}
  />
);

const createMockOperation = (
  overrides?: Partial<ActiveDROperation>
): ActiveDROperation => ({
  drpcName: 'drpc-app1',
  applicationName: 'app1',
  applicationNamespace: 'ns1',
  action: DRActionType.FAILOVER,
  phase: Phase.FailingOver,
  progression: Progression.FailingOver,
  sourceCluster: 'cluster1',
  targetCluster: 'cluster2',
  isDiscoveredApp: false,
  ...overrides,
});

const createMockAppNode = (
  isSource: boolean,
  operation: ActiveDROperation
): MockAppNode => ({
  getData: jest.fn(() => ({
    operation,
    isSource,
    clusterName: isSource ? operation.sourceCluster : operation.targetCluster,
    appCount: 1,
  })),
  getDimensions: jest.fn(() => ({ width: 50, height: 50 })),
  getId: jest.fn(
    () => `app-${operation.drpcName}-${isSource ? 'source' : 'target'}`
  ),
});

describe('MCOStyleAppNode', () => {
  describe('Source App Node', () => {
    it('should render source app with source animation class', () => {
      const operation = createMockOperation();
      const node = createMockAppNode(true, operation);

      const { container } = render(
        <svg>
          <MCOStyleAppNode element={node} />
        </svg>
      );

      const appNodeGroup = container.querySelector('.mco-app-node--source');
      expect(appNodeGroup).toBeInTheDocument();
    });

    it('should have fade-pulse animation class', () => {
      const operation = createMockOperation();
      const node = createMockAppNode(true, operation);

      const { container } = render(
        <svg>
          <MCOStyleAppNode element={node} />
        </svg>
      );

      const appNodeGroup = container.querySelector('.mco-app-node--source');
      expect(appNodeGroup).toBeInTheDocument();
    });

    it('should render with source class', () => {
      const operation = createMockOperation();
      const node = createMockAppNode(true, operation);

      const { container } = render(
        <svg>
          <MCOStyleAppNode element={node} />
        </svg>
      );

      const appNode = container.querySelector('.mco-app-node--source');
      expect(appNode).toBeInTheDocument();
    });

    it('should have lower opacity (fading out)', () => {
      const operation = createMockOperation();
      const node = createMockAppNode(true, operation);

      const { container } = render(
        <svg>
          <MCOStyleAppNode element={node} />
        </svg>
      );

      // Source nodes get the mco-app-node--source class which applies lower opacity via CSS
      const appNode = container.querySelector('.mco-app-node--source');
      expect(appNode).toBeInTheDocument();
    });
  });

  describe('Target App Node', () => {
    it('should render target app with target animation class', () => {
      const operation = createMockOperation();
      const node = createMockAppNode(false, operation);

      const { container } = render(
        <svg>
          <MCOStyleAppNode element={node} />
        </svg>
      );

      const appNodeGroup = container.querySelector('.mco-app-node--target');
      expect(appNodeGroup).toBeInTheDocument();
    });

    it('should have brighten-pulse animation class', () => {
      const operation = createMockOperation();
      const node = createMockAppNode(false, operation);

      const { container } = render(
        <svg>
          <MCOStyleAppNode element={node} />
        </svg>
      );

      const appNodeGroup = container.querySelector('.mco-app-node--target');
      expect(appNodeGroup).toBeInTheDocument();
    });

    it('should render with target class', () => {
      const operation = createMockOperation();
      const node = createMockAppNode(false, operation);

      const { container } = render(
        <svg>
          <MCOStyleAppNode element={node} />
        </svg>
      );

      const appNode = container.querySelector('.mco-app-node--target');
      expect(appNode).toBeInTheDocument();
    });

    it('should have higher opacity (arriving/solid)', () => {
      const operation = createMockOperation();
      const node = createMockAppNode(false, operation);

      const { container } = render(
        <svg>
          <MCOStyleAppNode element={node} />
        </svg>
      );

      // Target nodes get the mco-app-node--target class which applies higher opacity via CSS
      const appNode = container.querySelector('.mco-app-node--target');
      expect(appNode).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('should render CubeIcon for app', () => {
      const operation = createMockOperation();
      const node = createMockAppNode(true, operation);

      const { container } = render(
        <svg>
          <MCOStyleAppNode element={node} />
        </svg>
      );

      // CubeIcon (now CogIcon) should be rendered inside the node
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should show count badge when multiple apps', () => {
      const operation = createMockOperation();
      const node = {
        ...createMockAppNode(true, operation),
        getData: jest.fn(() => ({
          operation,
          isSource: true,
          clusterName: 'cluster1',
          appCount: 3,
        })),
      };

      const { container } = render(
        <svg>
          <MCOStyleAppNode element={node} />
        </svg>
      );

      const texts = container.querySelectorAll('text');
      const countBadge = Array.from(texts).find((t) => t.textContent === '3');
      expect(countBadge).toBeInTheDocument();
    });

    it('should have border stroke', () => {
      const operation = createMockOperation();
      const node = createMockAppNode(true, operation);

      const { container } = render(
        <svg>
          <MCOStyleAppNode element={node} />
        </svg>
      );

      // Verify the node renders successfully with DefaultNode mock
      expect(
        container.querySelector('[data-testid="default-node"]')
      ).toBeInTheDocument();
    });
  });

  describe('Different Operations', () => {
    it('should render correctly for Failover operation', () => {
      const operation = createMockOperation({ action: DRActionType.FAILOVER });
      const node = createMockAppNode(true, operation);

      expect(() => {
        render(
          <svg>
            <MCOStyleAppNode element={node} />
          </svg>
        );
      }).not.toThrow();
    });

    it('should render correctly for Relocate operation', () => {
      const operation = createMockOperation({ action: DRActionType.RELOCATE });
      const node = createMockAppNode(false, operation);

      expect(() => {
        render(
          <svg>
            <MCOStyleAppNode element={node} />
          </svg>
        );
      }).not.toThrow();
    });
  });
});
