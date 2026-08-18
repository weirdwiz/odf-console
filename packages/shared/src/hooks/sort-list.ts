import * as React from 'react';
import * as _ from 'lodash-es';
import { SortByDirection } from '@patternfly/react-table';

type SortableColumn<R> = {
  sortFunction?: (a: R, b: R, direction: SortByDirection) => number;
};

export const useSortList = <R>(
  data: R[],
  columns: SortableColumn<R>[],
  // True indicate the column index is starting from 1
  onSelect: boolean,
  initialSortIndex?: number
) => {
  const [sortIndex, setSortIndex] = React.useState(
    _.isInteger(initialSortIndex) ? initialSortIndex : -1
  );
  const [sortDirection, setSortDirection] = React.useState<SortByDirection>(
    SortByDirection.asc
  );

  const onSort = React.useCallback(
    (
      _event: React.MouseEvent,
      columnIndex: number,
      sortByDirection: SortByDirection
    ) => {
      setSortIndex(columnIndex);
      setSortDirection(sortByDirection);
    },
    [setSortIndex, setSortDirection]
  );

  const sortedData = React.useMemo(() => {
    return sortIndex !== -1
      ? data.sort((a, b) => {
          const index = onSelect ? sortIndex - 1 : sortIndex;
          const sortFunction = columns[index]?.sortFunction;
          return sortFunction ? sortFunction(a, b, sortDirection) : 0;
        })
      : data;
    // columns is not a state variable so its value will not change, but its reference might change on every re-render of parent component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sortIndex, sortDirection, onSelect]);

  return {
    onSort,
    sortIndex,
    sortDirection,
    sortedData,
  };
};
