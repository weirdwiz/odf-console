import * as React from 'react';
import * as TestDependency1 from '@odf/core/redux/selectors';
import * as TestDependency4 from '@odf/shared/hooks/custom-prometheus-poll';
import {
  PrometheusResponse,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import * as TestDependency3 from '@openshift-console/dynamic-plugin-sdk';
import * as TestDependency6 from '@openshift-console/dynamic-plugin-sdk/lib/utils/flags';
import * as TestDependency5 from '@openshift-console/dynamic-plugin-sdk-internal';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import * as TestDependency2 from 'react-router';
import Overview from './Overview';

const odfNamespace = 'test-ns';
jest
  .spyOn(TestDependency1, 'useODFNamespaceSelector')
  .mockImplementation(() => ({
    odfNamespace,
    isODFNsLoaded: true,
    odfNsLoadError: null,
    isNsSafe: true,
    isFallbackSafe: true,
  }));
jest
  .spyOn(TestDependency1, 'useODFSystemFlagsSelector')
  .mockImplementation(() => ({
    systemFlags: {
      [odfNamespace]: {
        isInternalMode: true,
        isExternalMode: false,
        isNoobaaStandalone: false,
      },
    },
    areFlagsSafe: true,
  }));
jest
  .spyOn(TestDependency2, 'useLocation')
  .mockImplementation(jest.fn(() => ({ pathname: '/overview', search: '' })));
jest.spyOn(TestDependency3, 'useK8sWatchResource').mockImplementation(
  jest.fn(() => {
    return [null, true, undefined];
  })
);
jest.spyOn(TestDependency3, 'useK8sWatchResources').mockImplementation(
  jest.fn(() => ({
    storageClusters: { data: [], loaded: true, loadError: null },
    flashSystemClusters: { data: [], loaded: true, loadError: null },
    remoteClusters: { data: [], loaded: true, loadError: null },
    sanClusters: { data: [], loaded: true, loadError: null },
    daemons: { data: [], loaded: true, loadError: null },
  }))
);
jest
  .spyOn(TestDependency3, 'useActivePerspective')
  .mockImplementation(jest.fn(() => ''));

const promResponse: PrometheusResponse = {
  status: 'success',
  data: {
    result: [
      {
        metric: {},
        value: [1712304917.483, '0'],
      },
    ],
    resultType: 'vector',
  },
};
jest
  .spyOn(TestDependency4, 'useCustomPrometheusPoll')
  .mockImplementation(jest.fn(() => [promResponse, null, false]));
jest
  .spyOn(TestDependency4, 'usePrometheusBasePath')
  .mockImplementation(jest.fn(() => ''));
jest
  .spyOn(TestDependency5, 'useUtilizationDuration')
  .mockImplementation(jest.fn(() => ({ duration: 0 })));
jest.spyOn(TestDependency6, 'useFlag').mockImplementation(jest.fn());

describe('General Overview', () => {
  it('only renders common cards', () => {
    jest.mocked(useFlag).mockReturnValue(false);
    render(
      <BrowserRouter>
        <Overview />
      </BrowserRouter>
    );
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Object storage')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(screen.getByText('External systems')).toBeInTheDocument();
  });

  it('also renders External Systems card', () => {
    jest.mocked(useFlag).mockReturnValue(true);
    render(
      <BrowserRouter>
        <Overview />
      </BrowserRouter>
    );
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Object storage')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(screen.getByText('External systems')).toBeInTheDocument();
  });
});
