import * as React from 'react';
import useDetailsLevel from '@patternfly/react-topology/dist/esm/hooks/useDetailsLevel';
import { CogIcon } from '@patternfly/react-icons';
import * as PatternflyTopology from '@patternfly/react-topology';
import {
  DEFAULT_DECORATOR_PADDING,
  DEFAULT_DECORATOR_RADIUS,
  Decorator,
  DefaultNode,
  Node,
  NodeModel,
  TopologyQuadrant,
  observer,
  ScaleDetailsLevel,
  WithSelectionProps,
} from '@patternfly/react-topology';
import { AppNodeData } from '../types';
import { renderDecorators } from '../utils/decorator-utils';
import { getDRNodeStatus } from '../utils/sidebar-utils';
import './MCOStyleAppNode.scss';

const getDefaultDecoratorCenter =
  PatternflyTopology['getDefaultShapeDecoratorCenter'];

type MCOStyleAppNodeProps = {
  element: Node<NodeModel, AppNodeData>;
} & Partial<WithSelectionProps & { hover?: boolean }>;

type MCOStyleAppNodeElement = Pick<Node<NodeModel, AppNodeData>, 'getData' | 'getDimensions'>;

type AppNodeRendererProps<Element extends MCOStyleAppNodeElement> = Omit<
  React.ComponentProps<typeof DefaultNode>,
  'element'
> & {
  element: Element;
};

type CountDecoratorProps = Pick<
  React.ComponentProps<typeof Decorator>,
  'x' | 'y' | 'radius' | 'showBackground' | 'icon'
>;

type MCOStyleAppNodeViewProps<Element extends MCOStyleAppNodeElement> = {
  element: Element;
  detailsLevel: ScaleDetailsLevel;
  NodeComponent: React.ComponentType<AppNodeRendererProps<Element>>;
  CountDecoratorComponent: React.ComponentType<CountDecoratorProps>;
  getCountDecoratorCenter: (element: Element) => { x: number; y: number };
  renderPhaseDecorators: (
    element: Element,
    data: AppNodeData
  ) => React.ReactNode;
} & Partial<WithSelectionProps & { hover?: boolean }>;

export const ICON_SIZE = 25;

const renderCountDecorator = <Element extends MCOStyleAppNodeElement>(
  element: Element,
  count: number,
  CountDecoratorComponent: React.ComponentType<CountDecoratorProps>,
  getCountDecoratorCenter: (element: Element) => { x: number; y: number }
): React.ReactNode => {
  const { x, y } = getCountDecoratorCenter(element);

  return (
    <CountDecoratorComponent
      x={x}
      y={y}
      radius={DEFAULT_DECORATOR_RADIUS}
      showBackground
      icon={
        <text
          x={DEFAULT_DECORATOR_RADIUS - DEFAULT_DECORATOR_PADDING}
          y={DEFAULT_DECORATOR_RADIUS - DEFAULT_DECORATOR_PADDING}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="10"
          fontWeight="bold"
        >
          {count}
        </text>
      }
    />
  );
};

export const MCOStyleAppNodeView = <Element extends MCOStyleAppNodeElement>({
  element,
  detailsLevel,
  NodeComponent,
  CountDecoratorComponent,
  getCountDecoratorCenter,
  renderPhaseDecorators,
  ...rest
}: MCOStyleAppNodeViewProps<Element>) => {
  const data = element.getData();
  const { width, height } = element.getDimensions();

  const appCount = data?.appCount || 1;

  const showLabel = rest.hover || detailsLevel !== ScaleDetailsLevel.low;

  // appStatus is pre-computed by the node-generator (for both static and operation nodes)
  const effectiveStatus = data.appStatus;
  const nodeStatus = getDRNodeStatus(effectiveStatus);
  const isOperation = !data?.isStatic && data?.isSource !== undefined;
  const animationClass = isOperation
    ? data.isSource
      ? 'mco-app-node--source'
      : 'mco-app-node--target'
    : undefined;

  const phaseDecorators = renderPhaseDecorators(element, data);

  const isTarget = isOperation && !data.isSource;

  return (
    <NodeComponent
      element={element}
      className={animationClass}
      scaleLabel={false}
      showLabel={showLabel}
      attachments={
        <>
          {renderCountDecorator(
            element,
            appCount,
            CountDecoratorComponent,
            getCountDecoratorCenter
          )}
          {phaseDecorators}
        </>
      }
      nodeStatus={nodeStatus}
      badge="DRPC"
      {...rest}
    >
      {!isTarget ? (
        <g
          transform={`translate(${(width - ICON_SIZE) / 2}, ${
            (height - ICON_SIZE) / 2
          })`}
        >
          <CogIcon width={ICON_SIZE} height={ICON_SIZE} />
        </g>
      ) : (
        // White box for destination - no icon
        <g>
          <rect
            x={width * 0.25}
            y={height * 0.25}
            width={width * 0.5}
            height={height * 0.5}
            fill="#fff"
            rx="4"
          />
        </g>
      )}
    </NodeComponent>
  );
};

const DefaultAppNodeRenderer: React.FC<
  AppNodeRendererProps<Node<NodeModel, AppNodeData>>
> = (props) => <DefaultNode {...props} />;

const MCOStyleAppNodeComponent: React.FC<MCOStyleAppNodeProps> = (props) => (
  <MCOStyleAppNodeView<Node<NodeModel, AppNodeData>>
    {...props}
    detailsLevel={useDetailsLevel()}
    NodeComponent={DefaultAppNodeRenderer}
    CountDecoratorComponent={Decorator}
    getCountDecoratorCenter={(element) =>
      getDefaultDecoratorCenter(TopologyQuadrant.upperRight, element)
    }
    renderPhaseDecorators={(element, data) =>
      renderDecorators(element, data, true)
    }
  />
);

export const MCOStyleAppNode = observer(MCOStyleAppNodeComponent);
