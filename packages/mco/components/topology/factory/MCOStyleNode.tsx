import * as React from 'react';
import { validateManagedClusterCondition } from '@odf/mco/utils';
import useDetailsLevel from '@patternfly/react-topology/dist/esm/hooks/useDetailsLevel';
import { TopologyIcon } from '@patternfly/react-icons';
import {
  DefaultNode,
  Node,
  NodeStatus,
  observer,
  ScaleDetailsLevel,
  WithSelectionProps,
} from '@patternfly/react-topology';
import { MANAGED_CLUSTER_CONDITION_AVAILABLE } from '../../../constants';
import './MCOStyleNode.scss';

type MCOStyleNodeProps = {
  element: Node;
} & Partial<WithSelectionProps & { hover?: boolean }>;

type MCOStyleNodeElement = Pick<Node, 'getData' | 'getDimensions'>;

type NodeRendererProps<Element extends MCOStyleNodeElement> = Omit<
  React.ComponentProps<typeof DefaultNode>,
  'element'
> & {
  element: Element;
};

type MCOStyleNodeViewProps<Element extends MCOStyleNodeElement> = {
  element: Element;
  detailsLevel: ScaleDetailsLevel;
  NodeComponent: React.ComponentType<NodeRendererProps<Element>>;
} & Partial<WithSelectionProps & { hover?: boolean }>;

export const ICON_SIZE = 45;

export const MCOStyleNodeView = <Element extends MCOStyleNodeElement>({
  element,
  detailsLevel,
  NodeComponent,
  ...rest
}: MCOStyleNodeViewProps<Element>) => {
  const data = element.getData();
  const { width, height } = element.getDimensions();

  const isHealthy = validateManagedClusterCondition(
    data.resource,
    MANAGED_CLUSTER_CONDITION_AVAILABLE
  );
  const nodeStatus = isHealthy ? NodeStatus.success : NodeStatus.danger;
  const statusTooltip = isHealthy
    ? 'Cluster is healthy'
    : 'Cluster is unhealthy';

  // DefaultNode handles hover internally, we get it from rest props
  const showLabel = rest.hover || detailsLevel !== ScaleDetailsLevel.low;

  return (
    <NodeComponent
      element={element}
      scaleLabel={false}
      showLabel={showLabel}
      nodeStatus={nodeStatus}
      showStatusDecorator={detailsLevel === ScaleDetailsLevel.high}
      statusDecoratorTooltip={statusTooltip}
      onStatusDecoratorClick={() => null}
      {...rest}
    >
      <g
        transform={`translate(${(width - ICON_SIZE) / 2}, ${
          (height - ICON_SIZE) / 2
        })`}
      >
        <TopologyIcon width={ICON_SIZE} height={ICON_SIZE} />
      </g>
    </NodeComponent>
  );
};

const DefaultNodeRenderer: React.FC<NodeRendererProps<Node>> = (props) => (
  <DefaultNode {...props} />
);

const MCOStyleNodeComponent: React.FC<MCOStyleNodeProps> = (props) => (
  <MCOStyleNodeView<Node>
    {...props}
    detailsLevel={useDetailsLevel()}
    NodeComponent={DefaultNodeRenderer}
  />
);

export const MCOStyleNode = observer(MCOStyleNodeComponent);
