import * as React from 'react';
import { cephStorageLabel } from '@odf/core/constants';
import { useNodesData } from '@odf/core/hooks';
import { NodeData } from '@odf/core/types';
import { nodesWithoutTaints } from '@odf/core/utils';
import { ListPageFilterWrapper } from '@odf/shared';
import { StatusBox } from '@odf/shared/generic/status-box';
import { hasLabel } from '@odf/shared/selectors';
import { NodeKind } from '@odf/shared/types';
import {
  ListPageBody,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import { NodesTable } from '../../nodes-table/NodesTable';
import { WizardNodeState, WizardState } from '../reducer';
import { SelectNodesTableFooter } from './select-nodes-table-footer';
import './select-nodes-table.scss';

export const selectNodesTableDeps = {
  useNodesData,
  useListPageFilter: (
    ...args: Parameters<typeof useListPageFilter>
  ): ReturnType<typeof useListPageFilter> => useListPageFilter(...args),
  ListPageFilterWrapper: (
    props: React.ComponentProps<typeof ListPageFilterWrapper>
  ) => <ListPageFilterWrapper {...props} />,
};

type InternalNodeTableProps = {
  onRowSelected: (selectedNodes: NodeData[]) => void;
  nodesData: NodeData[];
  disableLabeledNodes: boolean;
  systemNamespace: WizardState['backingStorage']['systemNamespace'];
};

const InternalNodeTable: React.FC<InternalNodeTableProps> = ({
  onRowSelected,
  nodesData,
  disableLabeledNodes,
  systemNamespace,
}) => {
  const storageLabel = cephStorageLabel(systemNamespace);
  const selectableNodes = React.useMemo(
    () => nodesWithoutTaints(nodesData),
    [nodesData]
  );
  const [selectedNodes, setSelectedNodes] = React.useState<NodeData[]>([]);
  const hasInitializedSelection = React.useRef(false);

  React.useEffect(() => {
    if (hasInitializedSelection.current || !selectableNodes.length) return;
    if (selectedNodes.length > 0) return;
    const preSelected = selectableNodes.filter((node) =>
      hasLabel(node, storageLabel)
    );
    if (preSelected.length) {
      setSelectedNodes(preSelected);
      onRowSelected(preSelected);
    }
    hasInitializedSelection.current = true;
  }, [onRowSelected, selectableNodes, selectedNodes.length, storageLabel]);

  const handleRowSelection = React.useCallback(
    (selected: NodeData[]) => {
      setSelectedNodes(selected);
      onRowSelected(selected);
    },
    [onRowSelected]
  );

  // SAFETY: k8s watch returns K8sResourceCommon; the component expects the narrower NodeKind type.
  const isRowSelectable = React.useCallback(
    (node: NodeData) =>
      !disableLabeledNodes || !hasLabel(node as NodeKind, storageLabel),
    [disableLabeledNodes, storageLabel]
  );

  return (
    <NodesTable
      nodes={selectableNodes}
      selectedNodes={selectedNodes}
      setSelectedNodes={handleRowSelection}
      loaded
      isRowSelectable={isRowSelectable}
      hideSelectAll={disableLabeledNodes}
    />
  );
};

type SelectNodesTableProps = {
  nodes: WizardNodeState[];
  onRowSelected: (selectedNodes: NodeData[]) => void;
  disableLabeledNodes?: boolean;
  systemNamespace: WizardState['backingStorage']['systemNamespace'];
};

export const SelectNodesTable: React.FC<SelectNodesTableProps> = ({
  nodes,
  onRowSelected,
  disableLabeledNodes = false,
  systemNamespace,
}) => {
  const [nodesData, nodesLoaded, nodesLoadError] =
    selectNodesTableDeps.useNodesData();
  // SAFETY: useListPageFilter returns [unfiltered, filtered, onFilterChange] for NodeData[]; the cast narrows the generic tuple.
  const [data, filteredData, onFilterChange] =
    selectNodesTableDeps.useListPageFilter(nodesData) as [
      NodeData[],
      NodeData[],
      (...args: unknown[]) => void,
    ];

  return (
    <div className="odf-capacity-and-nodes__select-nodes">
      <ListPageBody>
        <ListPageFilterWrapper
          data={data}
          loaded={nodesLoaded}
          onFilterChange={onFilterChange}
          hideColumnManagement={true}
        />
        <StatusBox
          skeleton={<div className="loading-skeleton--table" />}
          data={filteredData}
          loaded={nodesLoaded}
          loadError={nodesLoadError}
        >
          <InternalNodeTable
            onRowSelected={onRowSelected}
            nodesData={filteredData}
            disableLabeledNodes={disableLabeledNodes}
            systemNamespace={systemNamespace}
          />
        </StatusBox>
      </ListPageBody>
      {!!nodes.length && <SelectNodesTableFooter nodes={nodes} />}
    </div>
  );
};
