import * as React from 'react';
import { FileSystemKind } from '@odf/core/types/scale';
import { StorageClusterKind } from '@odf/shared/types';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import {
  ExternalSystemsCard,
  externalSystemsCardDeps,
} from './ExternalSystemsCard';

jest
  .spyOn(externalSystemsCardDeps, 'useWatchStorageClusters')
  .mockImplementation(jest.fn());
jest.spyOn(externalSystemsCardDeps, 'useFlag').mockImplementation(jest.fn());
jest
  .spyOn(externalSystemsCardDeps, 'useK8sWatchResource')
  .mockImplementation(jest.fn());
jest
  .spyOn(externalSystemsCardDeps, 'useCustomTranslation')
  .mockImplementation(() => ({
    t: (key: string) => key,
  }));

const mockWatchClusters = <Overrides extends object>(overrides?: Overrides) => {
  jest.mocked(externalSystemsCardDeps.useWatchStorageClusters).mockReturnValue({
    storageClusters: { data: [], loaded: true, loadError: null },
    flashSystemClusters: { data: [], loaded: true, loadError: null },
    remoteClusters: { data: [], loaded: true, loadError: null },
    sanClusters: { data: [], loaded: true, loadError: null },
    ...(overrides ?? {}),
  });
};

const mockFileSystems = (fileSystems: FileSystemKind[] = []) => {
  jest
    .mocked(externalSystemsCardDeps.useK8sWatchResource)
    .mockReturnValue([fileSystems, true, undefined]);
};

const lunGroup = (
  name: string,
  health: 'connected' | 'error' | 'creating'
): FileSystemKind => {
  const base: FileSystemKind = {
    apiVersion: 'scale.spectrum.ibm.com/v1beta1',
    kind: 'Filesystem',
    metadata: { name },
    spec: {
      local: {
        pools: [{ disks: ['disk-1'] }],
        replication: '1-way',
        type: 'shared',
      },
    },
  };

  if (health === 'connected') {
    base.status = {
      conditions: [
        {
          type: 'Success',
          status: 'True',
          reason: 'Ready',
          message: '',
          lastTransitionTime: '2026-01-01T00:00:00Z',
        },
        {
          type: 'Mounted',
          status: 'True',
          reason: 'Ready',
          message: '',
          lastTransitionTime: '2026-01-01T00:00:00Z',
        },
      ],
    };
  } else if (health === 'creating') {
    base.metadata.creationTimestamp = new Date().toISOString();
  } else {
    base.status = {
      conditions: [
        {
          type: 'Success',
          status: 'False',
          reason: 'Failed',
          message: 'failed',
          lastTransitionTime: '2026-01-01T00:00:00Z',
        },
      ],
    };
  }

  return base;
};

const cnsaFilesystem = (
  name: string,
  health: 'connected' | 'error' | 'creating'
): FileSystemKind => {
  const base: FileSystemKind = {
    apiVersion: 'scale.spectrum.ibm.com/v1beta1',
    kind: 'Filesystem',
    metadata: { name },
    spec: {
      remote: {
        cluster: 'remote-cluster-1',
        fs: 'gpfs1',
      },
    },
  };

  if (health === 'connected') {
    base.status = {
      conditions: [
        {
          type: 'Success',
          status: 'True',
          reason: 'Ready',
          message: '',
          lastTransitionTime: '2026-01-01T00:00:00Z',
        },
      ],
    };
  } else if (health === 'creating') {
    base.metadata.creationTimestamp = new Date().toISOString();
  } else {
    base.status = {
      conditions: [
        {
          type: 'Success',
          status: 'False',
          reason: 'Failed',
          message: 'failed',
          lastTransitionTime: '2026-01-01T00:00:00Z',
        },
      ],
    };
  }

  return base;
};

// SAFETY: Test fixture provides only metadata, spec.externalStorage, and status.phase
// because ExternalSystemsCard reads no other StorageClusterKind fields.
const externalCephCluster = (name: string, phase: string): StorageClusterKind =>
  ({
    metadata: { name, namespace: 'openshift-storage' },
    spec: {
      externalStorage: {
        enable: true,
      },
    },
    status: { phase },
  }) as StorageClusterKind;

const flashCluster = (name: string, phase: string) => ({
  metadata: { name },
  status: { phase },
});

const renderCard = () =>
  render(
    <BrowserRouter>
      <ExternalSystemsCard />
    </BrowserRouter>
  );

describe('ExternalSystemsCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(externalSystemsCardDeps.useFlag).mockReturnValue(true);
    mockWatchClusters();
    mockFileSystems();
  });

  it('shows empty message when no external systems are connected', () => {
    renderCard();
    expect(
      screen.getByText('No external systems connected')
    ).toBeInTheDocument();
  });

  it('shows loading skeleton while cluster watches are still loading', () => {
    mockWatchClusters({
      storageClusters: { data: [], loaded: false, loadError: null },
      flashSystemClusters: { data: [], loaded: false, loadError: null },
      remoteClusters: { data: [], loaded: false, loadError: null },
      sanClusters: { data: [], loaded: false, loadError: null },
    });
    jest
      .mocked(externalSystemsCardDeps.useK8sWatchResource)
      .mockReturnValue([[], false, undefined]);

    renderCard();
    expect(
      screen.getByText('Loading external systems data')
    ).toBeInTheDocument();
  });

  it('renders SAN row with LUN group status counts when only SAN cluster exists', () => {
    mockWatchClusters({
      sanClusters: {
        data: [{ metadata: { name: 'san-cluster' } }],
        loaded: true,
        loadError: null,
      },
    });
    mockFileSystems([
      lunGroup('lun-healthy', 'connected'),
      lunGroup('lun-error', 'error'),
    ]);

    renderCard();

    expect(
      screen.getByText('Storage Area Network LUN groups')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('IBM Storage Scale file systems')
    ).not.toBeInTheDocument();

    const sanRow = screen
      .getByText('Storage Area Network LUN groups')
      .closest('dt');
    const description = sanRow?.nextElementSibling;
    if (!(description instanceof HTMLElement))
      throw new Error('expected HTMLElement sibling');
    expect(within(description).getAllByText('1')).toHaveLength(2);
  });

  it('renders SAN row when Cluster exists without RemoteCluster', () => {
    mockWatchClusters({
      sanClusters: {
        data: [{ metadata: { name: 'san-cluster' } }],
        loaded: true,
        loadError: null,
      },
    });
    mockFileSystems([]);

    renderCard();

    expect(
      screen.getByText('Storage Area Network LUN groups')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('IBM Storage Scale file systems')
    ).not.toBeInTheDocument();
  });

  it('renders CNSA row when both RemoteCluster and Cluster CRs exist', () => {
    mockWatchClusters({
      sanClusters: {
        data: [{ metadata: { name: 'local-scale-cluster' } }],
        loaded: true,
        loadError: null,
      },
      remoteClusters: {
        data: [{ metadata: { name: 'remote-cluster-1' } }],
        loaded: true,
        loadError: null,
      },
    });
    mockFileSystems([
      cnsaFilesystem('fs-healthy', 'connected'),
      cnsaFilesystem('fs-error', 'error'),
    ]);

    renderCard();

    expect(
      screen.getByText('IBM Storage Scale file systems')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Storage Area Network LUN groups')
    ).not.toBeInTheDocument();
  });

  it('renders CNSA row with filesystem status counts when remote cluster exists', () => {
    mockWatchClusters({
      remoteClusters: {
        data: [{ metadata: { name: 'remote-cluster-1' } }],
        loaded: true,
        loadError: null,
      },
    });
    mockFileSystems([
      cnsaFilesystem('fs-healthy', 'connected'),
      cnsaFilesystem('fs-error', 'error'),
    ]);

    renderCard();

    expect(
      screen.getByText('IBM Storage Scale file systems')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Storage Area Network LUN groups')
    ).not.toBeInTheDocument();
  });

  it('sorts connected system rows alphabetically by label', () => {
    mockWatchClusters({
      remoteClusters: {
        data: [{ metadata: { name: 'remote-cluster-1' } }],
        loaded: true,
        loadError: null,
      },
      flashSystemClusters: {
        data: [flashCluster('flash-1', 'Ready')],
        loaded: true,
        loadError: null,
      },
      storageClusters: {
        data: [externalCephCluster('ceph-ext', 'Ready')],
        loaded: true,
        loadError: null,
      },
    });
    mockFileSystems([cnsaFilesystem('fs-1', 'connected')]);

    renderCard();

    const labels = screen
      .getAllByRole('term')
      .map((node) => node.textContent?.trim());
    expect(labels).toEqual([
      'IBM FlashSystem clusters',
      'IBM Storage Scale file systems',
      'Red Hat Ceph clusters',
    ]);
  });

  it('renders view external systems link', () => {
    renderCard();
    expect(screen.getByText('View external systems')).toBeInTheDocument();
  });
});
