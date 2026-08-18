import * as React from 'react';
import {
  DefaultEdge,
  Edge,
  EdgeStyle,
  EdgeTerminalType,
  observer,
  WithSelectionProps,
} from '@patternfly/react-topology';
import './MCOStyleEdge.scss';

type MCOStyleEdgeProps = {
  element: Edge;
} & Partial<WithSelectionProps & { hover?: boolean }>;

type EdgeRendererProps<Element> = Omit<
  React.ComponentProps<typeof DefaultEdge>,
  'element'
> & {
  element: Element;
};

type MCOStyleEdgeViewProps<Element> = {
  element: Element;
  EdgeComponent: React.ComponentType<EdgeRendererProps<Element>>;
} & Partial<WithSelectionProps & { hover?: boolean }>;

export const MCOStyleEdgeView = <Element, >({
  element,
  EdgeComponent,
  ...rest
}: MCOStyleEdgeViewProps<Element>) => {
  // Directional edges with arrows to show operation direction clearly
  return (
    <EdgeComponent
      element={element}
      {...rest}
      endTerminalType={EdgeTerminalType.directional}
      startTerminalType={EdgeTerminalType.none}
      edgeStyle={EdgeStyle.solid}
      className="mco-topology-edge--active-operation"
    />
  );
};

const MCOStyleEdgeComponent: React.FC<MCOStyleEdgeProps> = (props) => (
  <MCOStyleEdgeView {...props} EdgeComponent={DefaultEdge} />
);

export const MCOStyleEdge = observer(MCOStyleEdgeComponent);
