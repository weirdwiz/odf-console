import * as React from 'react';
import { PrometheusResponse } from '@openshift-console/dynamic-plugin-sdk';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { externalSystemsCardDeps } from './external-systems-card/ExternalSystemsCard';
import Overview, { overviewDeps } from './Overview';
import { storageClusterCardDeps } from './storage-cluster-card/StorageClusterCard';

const odfNamespace = 'test-ns';

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
  .spyOn(overviewDeps, 'useODFSystemFlagsSelector')
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
  .spyOn(overviewDeps, 'GeneralOverviewActivityCard')
  .mockImplementation(() => <div>Activity</div>);
jest
  .spyOn(overviewDeps, 'HealthOverviewCard')
  .mockImplementation(() => <div>Health</div>);
jest
  .spyOn(overviewDeps, 'ObjectStorageCard')
  .mockImplementation(() => <div>Object storage</div>);
// SAFETY: Mock return value satisfies Location shape; the cast matches the useLocation return type.
jest
  .spyOn(overviewDeps, 'useLocation')
  .mockImplementation(
    () =>
      ({ pathname: '/overview', search: '' }) as ReturnType<
        typeof overviewDeps.useLocation
      >
  );
// SAFETY: Mock return value provides the t() identity function matching the useCustomTranslation contract.
jest
  .spyOn(overviewDeps, 'useCustomTranslation')
  .mockImplementation(
    () =>
      ({ t: (k: string) => k }) as ReturnType<
        typeof overviewDeps.useCustomTranslation
      >
  );

jest.spyOn(storageClusterCardDeps, 'useODFNamespaceSelector').mockReturnValue({
  odfNamespace,
  isODFNsLoaded: true,
  odfNsLoadError: null,
  isNsSafe: true,
  isFallbackSafe: true,
});
jest
  .spyOn(storageClusterCardDeps, 'useK8sWatchResource')
  .mockReturnValue([null, true, undefined]);
jest
  .spyOn(storageClusterCardDeps, 'useSafeK8sWatchResource')
  .mockReturnValue([null, true, undefined]);
// SAFETY: Mock return value provides the t() identity function matching the useCustomTranslation contract.
jest
  .spyOn(storageClusterCardDeps, 'useCustomTranslation')
  .mockReturnValue({ t: (k: string) => k } as ReturnType<
    typeof storageClusterCardDeps.useCustomTranslation
  >);
jest.spyOn(storageClusterCardDeps, 'useNavigate').mockReturnValue(jest.fn());
jest
  .spyOn(storageClusterCardDeps, 'useCustomPrometheusPoll')
  .mockReturnValue([promResponse, null, false]);
jest.spyOn(storageClusterCardDeps, 'usePrometheusBasePath').mockReturnValue('');
jest
  .spyOn(storageClusterCardDeps, 'useFetchCsv')
  .mockReturnValue([undefined, false, undefined]);
jest
  .spyOn(storageClusterCardDeps, 'useGetOCSHealth')
  .mockReturnValue([undefined, false, undefined]);
jest
  .spyOn(storageClusterCardDeps, 'useRawCapacity')
  .mockReturnValue([undefined, undefined, false]);

// SAFETY: Mock return value provides the t() identity function matching the useCustomTranslation contract.
jest
  .spyOn(externalSystemsCardDeps, 'useCustomTranslation')
  .mockReturnValue({ t: (k: string) => k } as ReturnType<
    typeof externalSystemsCardDeps.useCustomTranslation
  >);
jest
  .spyOn(externalSystemsCardDeps, 'useWatchStorageClusters')
  .mockReturnValue([[], true, null]);
jest.spyOn(externalSystemsCardDeps, 'useFlag').mockReturnValue(false);
jest
  .spyOn(externalSystemsCardDeps, 'useK8sWatchResource')
  .mockReturnValue([[], true, undefined]);

describe('General Overview', () => {
  it('only renders common cards', () => {
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
