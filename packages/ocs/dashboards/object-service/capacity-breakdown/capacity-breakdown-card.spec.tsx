import * as React from 'react';
import { render, screen } from '@testing-library/react';
import BreakdownCard, {
  capacityBreakdownCardDeps,
} from './capacity-breakdown-card';

const testNamespace = 'test-ns';
jest
  .spyOn(capacityBreakdownCardDeps, 'useK8sWatchResource')
  .mockImplementation(() => [true, false, false]);
jest
  .spyOn(capacityBreakdownCardDeps, 'useCustomPrometheusPoll')
  .mockImplementation(() => [true, false, false]);
jest
  .spyOn(capacityBreakdownCardDeps, 'useODFNamespaceSelector')
  .mockImplementation(() => ({ odfNamespace: testNamespace }));
jest
  .spyOn(capacityBreakdownCardDeps, 'useODFSystemFlagsSelector')
  .mockImplementation(() => ({
    systemFlags: {
      [testNamespace]: {
        isRGWAvailable: true,
        isNoobaaAvailable: true,
        ocsClusterName: 'test-cluster',
      },
    },
  }));
jest
  .spyOn(capacityBreakdownCardDeps, 'useGetClusterDetails')
  .mockImplementation(() => ({
    clusterName: 'test-cluster',
    clusterNamespace: testNamespace,
  }));
jest
  .spyOn(capacityBreakdownCardDeps, 'usePrometheusBasePath')
  .mockImplementation(() => '/prometheus');
jest
  .spyOn(capacityBreakdownCardDeps, 'useCustomTranslation')
  .mockImplementation(() => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (!params) return key;
      return key.replace(/\{\{(\w+)\}\}/g, (_, param) =>
        String(params[param] ?? '')
      );
    },
  }));

describe('Capacity Breakdown Card', () => {
  it('renders the Capacity Breakdown Card', () => {
    render(<BreakdownCard />);

    expect(screen.getByText('Capacity breakdown')).toBeInTheDocument();
    expect(screen.getByLabelText('Help')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Service Type Dropdown Toggle')
    ).toBeInTheDocument();
    // Service type select toggle shows exact service type
    expect(screen.getByText('All')).toBeInTheDocument();
    // Breakdown select toggle shows exact metric name
    expect(screen.getByText('Total')).toBeInTheDocument();

    expect(
      screen.getByLabelText('Break By Dropdown Toggle')
    ).toBeInTheDocument();
  });
});
