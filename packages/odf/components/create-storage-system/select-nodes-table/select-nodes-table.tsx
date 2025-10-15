import * as React from 'react';
import { cephStorageLabel } from '@odf/core/constants';
import { useNodesData } from '@odf/core/hooks';
import { NodeData } from '@odf/core/types';
import {
  getZone,
  nodesWithoutTaints,
  getNodeCPUCapacity,
  getNodeTotalMemory,
} from '@odf/core/utils';
import { StatusBox } from '@odf/shared/generic/status-box';
import { NodeModel } from '@odf/shared/models';
import ResourceLink from '@odf/shared/resource-link/resource-link';
import { getName, hasLabel } from '@odf/shared/selectors';
import {
  RowComponentType,
  SelectableTable,
  TableVariant,
  TableColumnProps,
} from '@odf/shared/table';
import { NodeKind } from '@odf/shared/types';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import {
  resourcePathFromModel,
  getConvertedUnits,
  getNodeRoles,
  humanizeCpuCores,
} from '@odf/shared/utils';
import {
  ListPageBody,
  ListPageFilter,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import classNames from 'classnames';
import { sortable, Td } from '@patternfly/react-table';
import { WizardNodeState, WizardState } from '../reducer';
import { SelectNodesTableFooter } from './select-nodes-table-footer';
import './select-nodes-table.scss';

const tableColumnClasses = [
  classNames('pf-v5-u-w-33-on-md', 'pf-v5-u-w-50-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl', 'pf-v5-u-w-inherit-on-xl'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl', 'pf-v5-u-w-inherit-on-xl'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl', 'pf-v5-u-w-inherit-on-xl'),
  classNames('pf-v5-u-w-inherit'),
];

const nameSort = (a, b, c) => {
  const negation = c !== 'asc';
  const sortVal = a?.metadata.name.localeCompare(b?.metadata.name);
  return negation ? -sortVal : sortVal;
};

const InternalNodeTable: React.FC<NodeTableProps> = ({
  nodes,
  onRowSelected,
  nodesData,
  disableLabeledNodes,
  systemNamespace,
  loaded,
  loadError,
}) => {
  const { t } = useCustomTranslation();

  const storageLabel = React.useMemo(
    () => cephStorageLabel(systemNamespace),
    [systemNamespace]
  );

  const filteredNodes = React.useMemo(
    () => nodesWithoutTaints(nodesData),
    [nodesData]
  );

  const columns: TableColumnProps[] = React.useMemo(
    () => [
      {
        columnName: t('Name'),
        sortFunction: nameSort,
        transforms: [sortable],
        thProps: { className: tableColumnClasses[0] },
      },
      {
        columnName: t('Role'),
        thProps: { className: tableColumnClasses[1] },
      },
      {
        columnName: t('CPU'),
        thProps: { className: tableColumnClasses[2] },
      },
      {
        columnName: t('Memory'),
        thProps: { className: tableColumnClasses[3] },
      },
      {
        columnName: t('Zone'),
        thProps: { className: tableColumnClasses[4] },
      },
    ],
    [t]
  );

  const selectedRows = React.useMemo(
    () => filteredNodes.filter((node) => nodes.has(node?.metadata?.uid ?? '')),
    [filteredNodes, nodes]
  );

  React.useEffect(() => {
    if (nodes.size || !filteredNodes.length) {
      return;
    }
    const preSelected = filteredNodes.filter((node) =>
      hasLabel(node, storageLabel)
    );
    if (preSelected.length) {
      onRowSelected(preSelected);
    }
  }, [filteredNodes, nodes, onRowSelected, storageLabel]);

  const handleSelectionChange = React.useCallback(
    (updatedRows: NodeData[]) => {
      onRowSelected(updatedRows);
    },
    [onRowSelected]
  );

  const NodeRow = React.useCallback(
    ({ row }: RowComponentType<NodeData>) => {
      const roles = getNodeRoles(row) || [];
      const sortedRoles = [...roles].sort();
      const displayedRoles = sortedRoles.length ? sortedRoles.join(', ') : '-';

      return (
        <>
          <Td dataLabel={columns[0].columnName as string}>
            <ResourceLink
              link={resourcePathFromModel(NodeModel, getName(row))}
              resourceModel={NodeModel}
              resourceName={getName(row)}
            />
          </Td>
          <Td dataLabel={columns[1].columnName as string}>{displayedRoles}</Td>
          <Td dataLabel={columns[2].columnName as string}>
            {humanizeCpuCores(getNodeCPUCapacity(row)).string || '-'}
          </Td>
          <Td dataLabel={columns[3].columnName as string}>
            {getConvertedUnits(getNodeTotalMemory(row))}
          </Td>
          <Td dataLabel={columns[4].columnName as string}>
            {getZone(row) || '-'}
          </Td>
        </>
      );
    },
    [columns]
  );

  return (
    <div className="ceph-odf-install__select-nodes-table">
      <div data-test-id="select-nodes-table">
        <SelectableTable<NodeData>
          columns={columns}
          rows={filteredNodes}
          RowComponent={NodeRow}
          selectedRows={selectedRows}
          setSelectedRows={handleSelectionChange}
          loaded={loaded}
          loadError={loadError}
          variant={TableVariant.COMPACT}
          isRowSelectable={(row) =>
            !disableLabeledNodes || !hasLabel(row, storageLabel ?? '')
          }
          isColumnSelectableHidden={disableLabeledNodes}
        />
      </div>
    </div>
  );
};

type NodeTableProps = {
  nodes: Set<string>;
  onRowSelected: (selectedNodes: NodeKind[]) => void;
  nodesData: NodeData[];
  disableLabeledNodes: boolean;
  systemNamespace: WizardState['backingStorage']['systemNamespace'];
  loaded: boolean;
  loadError?: any;
};

export const SelectNodesTable: React.FC<SelectNodesTableProps> = ({
  nodes,
  onRowSelected,
  disableLabeledNodes = false,
  systemNamespace,
}) => {
  const [nodesData, nodesLoaded, nodesLoadError] = useNodesData();
  const [data, filteredData, onFilterChange] = useListPageFilter(nodesData);

  return (
    <div className="odf-capacity-and-nodes__select-nodes">
      <ListPageBody>
        <ListPageFilter
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
            nodes={new Set(nodes.map(({ uid }) => uid))}
            onRowSelected={onRowSelected}
            nodesData={filteredData}
            disableLabeledNodes={disableLabeledNodes}
            systemNamespace={systemNamespace}
            loaded={nodesLoaded}
            loadError={nodesLoadError}
          />
        </StatusBox>
      </ListPageBody>
      {!!nodes.length && <SelectNodesTableFooter nodes={nodes} />}
    </div>
  );
};

type SelectNodesTableProps = {
  nodes: WizardNodeState[];
  onRowSelected: (selectedNodes: NodeData[]) => void;
  disableLabeledNodes?: boolean;
  systemNamespace: WizardState['backingStorage']['systemNamespace'];
};
