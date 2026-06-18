import * as React from 'react';
import {
  MachineConfigKind,
  MachineConfigPoolKind,
} from '@odf/core/types/machineConfig';
import { MachineConfigModel, MachineConfigPoolModel } from '@odf/shared/models';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';

const KERNEL_DEVEL_EXTENSION = 'kernel-devel';
const WORKER_POOL_NAME = 'worker';

type KernelDevelValidation = {
  /** Whether any MachineConfig has kernel-devel in spec.extensions */
  isKernelDevelConfigured: boolean;
  /** Whether the worker MachineConfigPool has finished rolling out (Updated=True, Updating=False) */
  isMCPUpdated: boolean;
  /** Whether the MCP is currently rolling out changes */
  isMCPUpdating: boolean;
  /** Whether the MCP is in a degraded state */
  isMCPDegraded: boolean;
  /** True while resources are still loading */
  isLoading: boolean;
  /** Any error from watching the resources */
  error: string;
};

const useKernelDevelValidation = (): KernelDevelValidation => {
  const [machineConfigs, mcLoaded, mcError] = useK8sWatchResource<
    MachineConfigKind[]
  >({
    groupVersionKind: {
      group: MachineConfigModel.apiGroup,
      version: MachineConfigModel.apiVersion,
      kind: MachineConfigModel.kind,
    },
    isList: true,
  });

  const [machineConfigPools, mcpLoaded, mcpError] = useK8sWatchResource<
    MachineConfigPoolKind[]
  >({
    groupVersionKind: {
      group: MachineConfigPoolModel.apiGroup,
      version: MachineConfigPoolModel.apiVersion,
      kind: MachineConfigPoolModel.kind,
    },
    isList: true,
  });

  return React.useMemo(() => {
    const isLoading = !mcLoaded || !mcpLoaded;
    const error = mcError?.message || mcpError?.message || '';

    if (isLoading) {
      return {
        isKernelDevelConfigured: false,
        isMCPUpdated: false,
        isMCPUpdating: false,
        isMCPDegraded: false,
        isLoading: true,
        error,
      };
    }

    // Check if any MachineConfig has kernel-devel in spec.extensions
    const isKernelDevelConfigured = (machineConfigs || []).some((mc) =>
      mc.spec?.extensions?.includes(KERNEL_DEVEL_EXTENSION)
    );

    // Find the worker MachineConfigPool
    const workerPool = (machineConfigPools || []).find(
      (mcp) => mcp.metadata?.name === WORKER_POOL_NAME
    );

    const conditions = workerPool?.status?.conditions || [];

    const getConditionStatus = (type: string): string => {
      const condition = conditions.find((c) => c.type === type);
      return condition?.status || 'Unknown';
    };

    const isMCPUpdated = getConditionStatus('Updated') === 'True';
    const isMCPUpdating = getConditionStatus('Updating') === 'True';
    const isMCPDegraded = getConditionStatus('Degraded') === 'True';

    return {
      isKernelDevelConfigured,
      isMCPUpdated,
      isMCPUpdating,
      isMCPDegraded,
      isLoading,
      error,
    };
  }, [
    machineConfigs,
    mcLoaded,
    mcError,
    machineConfigPools,
    mcpLoaded,
    mcpError,
  ]);
};

export default useKernelDevelValidation;
