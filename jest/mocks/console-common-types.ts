export * from '@openshift-console/dynamic-plugin-sdk/lib/api/common-types.js';

// @TODO: Delete these runtime enums after @swc/jest supports exported const enums.
// See: https://github.com/swc-project/swc/issues/940
export enum SilenceStates {
  Active = 'active',
  Expired = 'expired',
  Pending = 'pending',
}

export enum AlertSeverity {
  Critical = 'critical',
  Info = 'info',
  None = 'none',
  Warning = 'warning',
}
