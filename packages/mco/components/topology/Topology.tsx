import * as React from 'react';
import { getMajorVersion } from '@odf/mco/utils';
import { ACMManagedClusterViewModel } from '@odf/shared';
import HandleErrorAndLoading from '@odf/shared/error-handler/ErrorStateHandler';
import { useDeepCompareMemoize } from '@odf/shared/hooks/deep-compare-memoize';
import { useFetchCsv } from '@odf/shared/hooks/use-fetch-csv';
import { getName } from '@odf/shared/selectors';
import {
  BaseTopologyView,
  useSelectionHandler,
  useTopologyControls,
  useVisualizationSetup,
} from '@odf/shared/topology';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { referenceForModel } from '@odf/shared/utils';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { EmptyState, EmptyStateBody, Title } from '@patternfly/react-core';
import { TopologyIcon } from '@patternfly/react-icons';
import {
  GraphElement,
  useVisualizationController,
  VisualizationProvider,
} from '@patternfly/react-topology';
import {
  MCO_CREATED_BY_LABEL_KEY,
  MCO_CREATED_BY_MC_CONTROLLER,
  ODFMCO_OPERATOR,
} from '../../constants';
import {
  getManagedClusterResourceObj,
  useProtectedAppsByCluster,
  useDRPoliciesByClusterPair,
  useActiveDROperations,
} from '../../hooks';
import { ACMManagedClusterKind, ACMManagedClusterViewKind } from '../../types';
import { getManagedClusterInfoTypes } from '../../utils/managed-cluster-info';
import { TopologyDataContext } from './context/TopologyContext';
import { mcoLayoutFactory } from './factory/MCOLayoutFactory';
import { mcoTopologyComponentFactory } from './factory/MCOStyleFactory';
import TopologySideBar from './sidebar/TopologySideBar';
import TopologyToolbar from './TopologyToolbar';
import { TopologyViewLevel, FilterType } from './types';
import { generateClusterNodesModel } from './utils/node-generator';
import './topology.scss';

export const topologyDependencies = {
  BaseTopologyView: (props: React.ComponentProps<typeof BaseTopologyView>) => (
    <BaseTopologyView {...props} />
  ),
  VisualizationProvider: (
    props: React.ComponentProps<typeof VisualizationProvider>
  ) => <VisualizationProvider {...props} />,
  getManagedClusterInfoTypes,
  getManagedClusterResourceObj,
  useActiveDROperations,
  useDRPoliciesByClusterPair,
  useFetchCsv,
  useK8sWatchResource,
  useProtectedAppsByCluster,
  useSelectionHandler,
  useTopologyControls,
  useVisualizationController,
  useVisualizationSetup,
};

const TopologyViewComponent: React.FC = () => {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [searchValue, setSearchValue] = React.useState('');
  const [selectedFilters, setSelectedFilters] = React.useState<FilterType[]>([
    FilterType.Cluster,
  ]);
  const controller = topologyDependencies.useVisualizationController();

  const [isSideBarOpen, setSideBarOpen] = React.useState(false);
  const {
    clusters,
    setSelectedElement,
    clusterAppsMap,
    clusterPairPoliciesMap,
    clusterPairOperationsMap,
  } = React.useContext(TopologyDataContext);

  const onCloseSideBar = React.useCallback(() => {
    setSideBarOpen(false);
    setSelectedIds([]);
  }, []);

  topologyDependencies.useSelectionHandler({
    controller,
    setSelectedElement,
    setSelectedIds,
    setSideBarOpen,
  });

  const prevStructureKeyRef = React.useRef<string>('');
  const prevSearchActiveRef = React.useRef(false);

  const memoizedClusters = useDeepCompareMemoize(clusters);
  const memoizedPolicies = useDeepCompareMemoize(clusterPairPoliciesMap);
  const memoizedOperations = useDeepCompareMemoize(clusterPairOperationsMap);
  const memoizedApps = useDeepCompareMemoize(clusterAppsMap);

  const model = React.useMemo(() => {
    return generateClusterNodesModel(
      memoizedClusters,
      memoizedPolicies,
      memoizedOperations,
      memoizedApps,
      {
        searchValue,
        filterTypes: selectedFilters,
      }
    );
  }, [
    memoizedClusters,
    memoizedPolicies,
    memoizedOperations,
    memoizedApps,
    searchValue,
    selectedFilters,
  ]);

  // Memoize structure key to avoid recreating arrays on every render
  const structureKey = React.useMemo(() => {
    return (model.nodes || [])
      .map((n) => n.id)
      .sort()
      .join(',');
  }, [model.nodes]);

  const isSearchActive = Boolean(searchValue.trim());

  // Initialize and update model when data changes
  React.useEffect(() => {
    if (!controller) return;

    const searchJustCleared = prevSearchActiveRef.current && !isSearchActive;
    prevSearchActiveRef.current = isSearchActive;

    controller.fromModel(model, true);

    const graph = controller.getGraph();
    if (!graph) return;

    const structureChanged = structureKey !== prevStructureKeyRef.current;

    let cancelled = false;

    if (isSearchActive) {
      requestAnimationFrame(() => {
        if (cancelled || !controller) return;
        graph.fit(100);
      });
      return () => {
        cancelled = true;
      };
    }

    if (searchJustCleared) {
      graph.reset();
    }

    const shouldLayout = structureChanged || searchJustCleared;

    requestAnimationFrame(() => {
      if (cancelled || !controller) return;
      if (shouldLayout) {
        try {
          graph.layout();
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console -- log layout failures for debugging
            console.warn('Topology layout failed:', error);
          }
        }
      }
      requestAnimationFrame(() => {
        if (cancelled || !controller) return;
        if (shouldLayout) {
          graph.fit(100);
          prevStructureKeyRef.current = structureKey;
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [controller, model, structureKey, isSearchActive]);

  const controlButtons = topologyDependencies.useTopologyControls({
    controller,
  });

  const selectedElement = React.useContext(TopologyDataContext).selectedElement;
  const selectedElementId = selectedElement?.getId();
  const selectedElementData = React.useMemo(() => {
    if (!selectedElementId) return undefined;
    const node = model.nodes?.find((n) => n.id === selectedElementId);
    if (node) return node.data;
    const edge = model.edges?.find((e) => e.id === selectedElementId);
    return edge?.data;
  }, [selectedElementId, model]);

  React.useEffect(() => {
    if (selectedElementId && selectedElementData === undefined) {
      onCloseSideBar();
    }
  }, [selectedElementId, selectedElementData, onCloseSideBar]);

  const isEdgeSelected =
    selectedElementData?.policies !== undefined ||
    selectedElementData?.isOperation !== undefined;
  const isAppNodeSelected =
    (selectedElementData?.operation !== undefined &&
      selectedElementData?.isSource !== undefined) ||
    selectedElementData?.isStatic === true; // Also handle static apps
  const isFailoverNodeSelected = selectedElementData?.operations !== undefined;

  const sidebarResource =
    isEdgeSelected || isAppNodeSelected || isFailoverNodeSelected
      ? null
      : selectedElementData?.resource;
  const sidebarEdgeData =
    isEdgeSelected || isAppNodeSelected || isFailoverNodeSelected
      ? selectedElementData
      : undefined;

  return (
    <>
      <TopologyToolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        selectedFilters={selectedFilters}
        onFilterChange={setSelectedFilters}
      />
      <div className="mco-topology__content">
        <topologyDependencies.BaseTopologyView
          controlButtons={controlButtons}
          sideBar={
            <TopologySideBar
              resource={sidebarResource}
              edgeData={sidebarEdgeData}
              onClose={onCloseSideBar}
              isExpanded={isSideBarOpen}
            />
          }
          sideBarOpen={isSideBarOpen}
          selectedIds={selectedIds}
        />
      </div>
    </>
  );
};

const TopologyEmptyState: React.FC = () => {
  const { t } = useCustomTranslation();

  return (
    <EmptyState
      titleText={
        <Title headingLevel="h4" size="lg">
          {t('No clusters found')}
        </Title>
      }
      icon={TopologyIcon}
    >
      <EmptyStateBody>
        {t('Connect managed clusters to view the topology')}
      </EmptyStateBody>
    </EmptyState>
  );
};

const Topology: React.FC = () => {
  const controller = topologyDependencies.useVisualizationSetup({
    componentFactory: mcoTopologyComponentFactory,
    layoutFactory: mcoLayoutFactory,
  });
  const [selectedElement, setSelectedElement] =
    React.useState<GraphElement | null>(null);

  const [managedClusters, loaded, loadError] =
    topologyDependencies.useK8sWatchResource<
    ACMManagedClusterKind[]
  >(topologyDependencies.getManagedClusterResourceObj());

  const [mcvs, mcvsLoaded, mcvsLoadError] =
    topologyDependencies.useK8sWatchResource<
    ACMManagedClusterViewKind[]
  >({
    kind: referenceForModel(ACMManagedClusterViewModel),
    selector: {
      matchLabels: { [MCO_CREATED_BY_LABEL_KEY]: MCO_CREATED_BY_MC_CONTROLLER },
    },
    isList: true,
  });

  const [clusterAppsMap, appsLoaded, appsLoadError] =
    topologyDependencies.useProtectedAppsByCluster();

  const [clusterPairPoliciesMap, policiesLoaded, policiesLoadError] =
    topologyDependencies.useDRPoliciesByClusterPair();

  const [clusterPairOperationsMap, operationsLoaded, operationsLoadError] =
    topologyDependencies.useActiveDROperations();

  const [csv, csvLoaded, csvLoadError] =
    topologyDependencies.useFetchCsv({
    specName: ODFMCO_OPERATOR,
  });
  const odfMCOVersion = getMajorVersion(csv?.spec?.version);

  // Filter clusters to only include those with valid ODF installed
  const clustersWithODF = React.useMemo(() => {
    if (!loaded || !mcvsLoaded || !odfMCOVersion || !csvLoaded) {
      return [];
    }

    const allClusters = topologyDependencies.getManagedClusterInfoTypes(
      managedClusters,
      mcvs,
      odfMCOVersion,
      undefined // We don't need provisioners for this filtering
    );

    // Filter to only include clusters with valid ODF version
    const validClusters = allClusters.filter(
      (cluster) => cluster?.odfInfo?.isValidODFVersion
    );

    // Return the original ACMManagedClusterKind objects
    return managedClusters.filter((cluster) =>
      validClusters.some((valid) => getName(valid) === getName(cluster))
    );
  }, [managedClusters, mcvs, odfMCOVersion, loaded, mcvsLoaded, csvLoaded]);

  const topologyDataContextData = React.useMemo(() => {
    return {
      clusters: clustersWithODF || [],
      selectedElement,
      setSelectedElement,
      visualizationLevel: TopologyViewLevel.CLUSTERS,
      odfMCOVersion,
      clusterAppsMap,
      clusterPairPoliciesMap,
      clusterPairOperationsMap,
    };
  }, [
    clustersWithODF,
    selectedElement,
    setSelectedElement,
    odfMCOVersion,
    clusterAppsMap,
    clusterPairPoliciesMap,
    clusterPairOperationsMap,
  ]);

  const allLoaded =
    loaded &&
    mcvsLoaded &&
    csvLoaded &&
    appsLoaded &&
    policiesLoaded &&
    operationsLoaded;
  const hasNoClusters =
    allLoaded && (!clustersWithODF || clustersWithODF.length === 0);

  return (
    <TopologyDataContext.Provider value={topologyDataContextData}>
      <topologyDependencies.VisualizationProvider controller={controller}>
        <div className="mco-topology" id="mco-topology">
          {hasNoClusters ? (
            <TopologyEmptyState />
          ) : (
            <HandleErrorAndLoading
              loading={
                !loaded ||
                !mcvsLoaded ||
                !appsLoaded ||
                !policiesLoaded ||
                !operationsLoaded ||
                !controller
              }
              error={(() => {
                const err =
                  loadError ||
                  mcvsLoadError ||
                  appsLoadError ||
                  policiesLoadError ||
                  operationsLoadError ||
                  csvLoadError;
                return (err instanceof Error ? err.message : err) || '';
              })()}
            >
              <TopologyViewComponent />
            </HandleErrorAndLoading>
          )}
        </div>
      </topologyDependencies.VisualizationProvider>
    </TopologyDataContext.Provider>
  );
};

export default Topology;
