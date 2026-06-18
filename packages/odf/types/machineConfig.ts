import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';

export type MachineConfigKind = K8sResourceCommon & {
  spec: {
    config?: {
      ignition?: {
        version: string;
      };
      [key: string]: unknown;
    };
    kernelArguments?: string[];
    extensions?: string[];
    fips?: boolean;
    kernelType?: string;
  };
};

export type MachineConfigPoolCondition = {
  lastTransitionTime: string;
  message: string;
  reason: string;
  status: 'True' | 'False' | 'Unknown';
  type: string;
};

export type MachineConfigPoolKind = K8sResourceCommon & {
  spec: {
    configuration?: {
      name?: string;
      source?: {
        apiVersion?: string;
        kind?: string;
        name?: string;
      }[];
    };
    machineConfigSelector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: {
        key: string;
        operator: string;
        values?: string[];
      }[];
    };
    nodeSelector?: {
      matchLabels?: Record<string, string>;
    };
    paused?: boolean;
  };
  status?: {
    conditions?: MachineConfigPoolCondition[];
    configuration?: {
      name?: string;
      source?: {
        apiVersion?: string;
        kind?: string;
        name?: string;
      }[];
    };
    degradedMachineCount?: number;
    machineCount?: number;
    observedGeneration?: number;
    readyMachineCount?: number;
    unavailableMachineCount?: number;
    updatedMachineCount?: number;
  };
};
