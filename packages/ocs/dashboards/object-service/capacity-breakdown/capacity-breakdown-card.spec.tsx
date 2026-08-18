import * as React from 'react';
import * as TestDependency4 from '@odf/core/hooks';
import * as TestDependency5 from '@odf/core/redux';
import * as TestDependency6 from '@odf/core/redux/utils';
import * as TestDependency3 from '@odf/shared/hooks/custom-prometheus-poll/custom-prometheus-poll-hook';
import * as TestDependency8 from '@odf/shared/useCustomTranslationHook';
import * as TestDependency1 from '@openshift-console/dynamic-plugin-sdk/lib/extensions';
import * as TestDependency2 from '@openshift-console/dynamic-plugin-sdk/lib/utils/flags';
import { render, screen } from '@testing-library/react';
import * as TestDependency7 from 'react-router';
import BreakdownCard from './capacity-breakdown-card';

const testNamespace = 'test-ns';
jest
  .spyOn(TestDependency1, 'useK8sWatchResource')
  .mockImplementation(() => [true, false, false]);
jest.spyOn(TestDependency2, 'useFlag').mockImplementation(() => true);
jest
  .spyOn(TestDependency3, 'useCustomPrometheusPoll')
  .mockImplementation(() => [true, false, false]);
jest
  .spyOn(TestDependency4, 'useSafeK8sWatchResource')
  .mockImplementation(() => [true, false, false]);
jest
  .spyOn(TestDependency5, 'useODFNamespaceSelector')
  .mockImplementation(() => ({ odfNamespace: testNamespace }));
jest
  .spyOn(TestDependency5, 'useODFSystemFlagsSelector')
  .mockImplementation(() => ({
    systemFlags: {
      [testNamespace]: {
        isRGWAvailable: true,
        isNoobaaAvailable: true,
        ocsClusterName: 'test-cluster',
      },
    },
  }));
jest.spyOn(TestDependency6, 'useGetClusterDetails').mockImplementation(() => ({
  clusterName: 'test-cluster',
  clusterNamespace: testNamespace,
}));
jest
  .spyOn(TestDependency7, 'useParams')
  .mockImplementation(() => ({ namespace: testNamespace }));
jest.spyOn(TestDependency8, 'useCustomTranslation').mockImplementation(() => ({
  t: (key: string, params?: Record<string, string | number>) => {
    if (!params) return key;
    // Simple interpolation for test purposes
    return key.replace(/\{\{(\w+)\}\}/g, (_, param) => params[param] || '');
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
