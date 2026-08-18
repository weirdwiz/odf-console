import * as React from 'react';
import { StoragePoolKind } from '../../types';

export const BlockPoolDashboardContext =
  React.createContext<BlockPoolDashboardContext>(
    // SAFETY: Default is never read at runtime; the provider always supplies
    // a real value. The empty object placeholder is required by createContext.
    {} as BlockPoolDashboardContext
  );

type BlockPoolDashboardContext = {
  obj: StoragePoolKind;
};
