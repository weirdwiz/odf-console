import * as React from 'react';
import { StatusBox } from '@odf/shared/generic/status-box';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import {
  OnSelect,
  SortByDirection,
  Table,
  TableVariant,
  Tbody,
  Th,
  ThProps,
  Thead,
  Tr,
} from '@patternfly/react-table';
import { useSortList } from '../hooks/sort-list';
import { useCustomTranslation } from '../useCustomTranslationHook';

export type TableColumnProps<T = K8sResourceCommon> = ThProps & {
  thProps?: TableThProps;
  columnName: string | React.ReactNode;
  sortFunction?: (a: T, b: T, direction: SortByDirection) => number;
};

export type RowComponentType<T, ExtraProps = undefined> = {
  row: T;
  rowIndex?: number;
  extraProps: ExtraProps;
};

export const ComposableTable: ComposableTableProps = <T, ExtraProps = undefined>({
  columns,
  rows,
  RowComponent,
  extraProps,
  loaded,
  loadError,
  unfilteredData,
  noDataMsg,
  emptyRowMessage,
  variant,
  isFavorites,
  selectProps,
}: TableProps<T, ExtraProps>) => {
  const {
    onSort,
    sortIndex: activeSortIndex,
    sortDirection: activeSortDirection,
    sortedData: sortedRows,
  } = useSortList<T>(rows, columns, false);
  const { t } = useCustomTranslation();

  const getSortParams = (columnIndex: number): ThProps['sort'] =>
    (() => {
      const value = {
        sortBy: {
          index: activeSortIndex,
          direction: activeSortDirection,
        },
        onSort: onSort,
        columnIndex,
      };
      if (isFavorites) Object.assign(value, { isFavorites: columnIndex === 0 });
      return value;
    })();

  return (
    <StatusBox
      loadError={loadError}
      loaded={loaded}
      data={sortedRows}
      EmptyMsg={emptyRowMessage}
      unfilteredData={unfilteredData}
      NoDataEmptyMsg={noDataMsg}
      skeleton={<div className="loading-skeleton--table pf-v6-u-mt-lg" />}
    >
      <Table
        aria-label={t('Composable table')}
        className="pf-v6-u-mt-md"
        variant={variant}
      >
        <Thead>
          <Tr>
            {!!selectProps && (
              <Th
                select={{
                  onSelect: selectProps.onSelect,
                  isSelected: selectProps.isAllSelected,
                }}
                aria-label={t('Select all')}
              />
            )}
            {columns?.map((col, index) => (
              <Th
                {...(!!col?.thProps ? col.thProps : {})}
                {...(!!col?.sortFunction ? { sort: getSortParams(index) } : {})}
                key={index}
              >
                {col?.columnName}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {sortedRows.map((row, rowIndex) => (
            <RowComponent
              row={row}
              rowIndex={rowIndex}
              extraProps={extraProps}
            />
          ))}
        </Tbody>
      </Table>
    </StatusBox>
  );
};

// Omit ref to resolve incompatible issue
// sort is replaced by sortFunction
type TableThProps = Omit<ThProps, 'sort' | 'ref'>;

export type SelectAllProps = {
  onSelect: OnSelect;
  isAllSelected: boolean;
};

export type TableProps<T, ExtraProps = undefined> = {
  rows: T[];
  columns: TableColumnProps<T>[];
  RowComponent: React.ComponentType<RowComponentType<T, ExtraProps>>;
  extraProps?: ExtraProps;
  loaded: boolean;
  loadError?: unknown;
  unfilteredData?: T[];
  noDataMsg?: React.FC;
  emptyRowMessage?: React.FC;
  variant?: TableVariant;
  isFavorites?: boolean;
  selectProps?: SelectAllProps;
};

type ComposableTableProps = <T, ExtraProps = undefined>(
  props: React.PropsWithoutRef<TableProps<T, ExtraProps>>
) => ReturnType<React.FC>;
