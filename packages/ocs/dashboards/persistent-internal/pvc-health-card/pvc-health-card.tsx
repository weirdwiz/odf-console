import * as React from 'react';
import { useGetInternalClusterDetails } from '@odf/core/redux/utils';
import { namespaceResource } from '@odf/core/resources';
import ResourceDropdown from '@odf/shared/dropdown/ResourceDropdown';
import {
  NamespaceModel,
  PersistentVolumeClaimModel,
  PersistentVolumeModel,
  StorageClassModel,
} from '@odf/shared/models';
import { getName, getNamespace } from '@odf/shared/selectors';
import { getAnnotations } from '@odf/shared/selectors';
import {
  ComposableTable,
  RowComponentType,
  TableColumnProps,
} from '@odf/shared/table/composable-table';
import {
  K8sResourceKind,
  StorageClassResourceKind,
  PersistentVolumeClaimKind,
} from '@odf/shared/types';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { resourcePathFromModel } from '@odf/shared/utils';
import {
  K8sResourceCommon,
  useK8sWatchResources,
  YellowExclamationTriangleIcon,
} from '@openshift-console/dynamic-plugin-sdk';
import { Link } from 'react-router-dom-v5-compat';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Label,
  Pagination,
  PaginationVariant,
} from '@patternfly/react-core';
import { ArrowRightIcon } from '@patternfly/react-icons';
import { TableVariant, Td, Tr } from '@patternfly/react-table';
import { VOLUME_HEALTH_ANNOTATION } from '../../../constants';
import { filterCephPVCsByCluster } from '../../../utils/common';

const watchResources = {
  pvcs: {
    isList: true,
    kind: PersistentVolumeClaimModel.kind,
  },
  pvs: {
    isList: true,
    kind: PersistentVolumeModel.kind,
  },
  sc: {
    isList: true,
    kind: StorageClassModel.kind,
  },
};

const PVCHealthRowComponent: React.FC<
  RowComponentType<PersistentVolumeClaimKind>
> = ({ row, rowIndex }) => {
  const { t } = useCustomTranslation();
  const pvcName = getName(row);
  const pvcNamespace = getNamespace(row);

  const pvcLink =
    pvcName && pvcNamespace
      ? resourcePathFromModel(PersistentVolumeClaimModel, pvcName, pvcNamespace)
      : null;
  const eventsLink = pvcLink ? `${pvcLink}/events` : null;

  return (
    <Tr key={rowIndex}>
      <Td dataLabel={t('Name')}>
        {pvcLink ? <Link to={pvcLink}>{pvcName}</Link> : pvcName}
      </Td>
      <Td dataLabel={t('Health Status')}>
        <Label color="orange" icon={<YellowExclamationTriangleIcon />}>
          {t('Unhealthy')}
        </Label>
      </Td>
      <Td dataLabel={t('Events')}>
        {eventsLink ? (
          <Link to={eventsLink}>
            <ArrowRightIcon className="pf-v6-u-mr-xs" />
            {t('View events')}
          </Link>
        ) : (
          '-'
        )}
      </Td>
    </Tr>
  );
};

const getInitialSortedNs = (
  allResources: K8sResourceCommon[]
): K8sResourceCommon | undefined =>
  allResources?.length
    ? [...allResources].sort((a, b) => getName(a).localeCompare(getName(b)))[0]
    : undefined;

const PER_PAGE = 5;

export const PVCHealthCard: React.FC = () => {
  const { t } = useCustomTranslation();
  const { clusterNamespace: clusterNs } = useGetInternalClusterDetails();
  const [selectedNamespace, setSelectedNamespace] = React.useState<string>('');
  const [page, setPage] = React.useState(1);

  const resources = useK8sWatchResources(watchResources);

  const pvcsLoaded = resources?.pvcs?.loaded;
  const pvcsLoadError = resources?.pvcs?.loadError;
  const pvcsData = (resources?.pvcs?.data ?? []) as PersistentVolumeClaimKind[];

  const pvsLoaded = resources?.pvs?.loaded;
  const pvsData = (resources?.pvs?.data ?? []) as K8sResourceKind[];

  const scData = (resources?.sc?.data ?? []) as StorageClassResourceKind[];
  const scLoaded = resources?.sc?.loaded;

  const loaded = pvcsLoaded && pvsLoaded && scLoaded;
  const loadError =
    pvcsLoadError || resources?.pvs?.loadError || resources?.sc?.loadError;

  // Filter to Ceph PVCs for this cluster
  const cephPVCs = React.useMemo(
    () => filterCephPVCsByCluster(scData, pvcsData, pvsData, clusterNs),
    [scData, pvcsData, pvsData, clusterNs]
  );

  // Filter to unhealthy PVCs (annotation === 'false')
  const unhealthyPVCs = React.useMemo(
    () =>
      cephPVCs.filter(
        (pvc) => getAnnotations(pvc)?.[VOLUME_HEALTH_ANNOTATION] === 'false'
      ),
    [cephPVCs]
  );

  // Apply namespace filter
  const filteredPVCs = React.useMemo(
    () =>
      selectedNamespace
        ? unhealthyPVCs.filter((pvc) => getNamespace(pvc) === selectedNamespace)
        : unhealthyPVCs,
    [unhealthyPVCs, selectedNamespace]
  );

  React.useEffect(() => {
    setPage(1);
  }, [filteredPVCs.length]);

  const initialSelection = React.useCallback(
    (allResources: K8sResourceCommon[]): K8sResourceCommon => {
      const initialResource = getInitialSortedNs(allResources);
      if (initialResource) {
        setSelectedNamespace(getName(initialResource));
      }
      return initialResource ?? allResources[0];
    },
    [setSelectedNamespace]
  );

  const columns: TableColumnProps[] = React.useMemo(
    () => [
      {
        columnName: t('Name'),
      },
      {
        columnName: t('Health Status'),
      },
      {
        columnName: t('Events'),
      },
    ],
    [t]
  );

  // Hide card when no unhealthy PVCs exist (across all namespaces)
  if (loaded && unhealthyPVCs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="pf-v6-u-display-flex pf-v6-u-justify-content-space-between pf-v6-u-align-items-center pf-v6-u-gap-md">
          <CardTitle>{t('Storage health - Persistent Volumes')}</CardTitle>
          <div className="pf-v6-u-min-width-on-md-200px">
            <ResourceDropdown<K8sResourceCommon>
              className="odf-pvc-health-card__namespace-dropdown"
              resource={namespaceResource}
              resourceModel={NamespaceModel}
              initialSelection={initialSelection}
              onSelect={(ns) => {
                setSelectedNamespace(getName(ns));
                setPage(1);
              }}
              data-test="pvc-health-card-namespace-dropdown"
            />
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <ComposableTable
          rows={filteredPVCs.slice((page - 1) * PER_PAGE, page * PER_PAGE)}
          columns={columns}
          RowComponent={PVCHealthRowComponent}
          loaded={loaded}
          loadError={loadError}
          variant={TableVariant.compact}
        />
        {filteredPVCs.length > PER_PAGE && (
          <Pagination
            itemCount={filteredPVCs.length}
            perPage={PER_PAGE}
            page={page}
            variant={PaginationVariant.bottom}
            onSetPage={(_e, newPage) => setPage(newPage)}
            isCompact
          />
        )}
      </CardBody>
    </Card>
  );
};

export default PVCHealthCard;
