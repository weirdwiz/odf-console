import * as React from 'react';
import { DRPlacementControlModel } from '@odf/shared';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { DR_BASE_ROUTE, ApplicationType, DRActionType } from '../../constants';
import { DRPlacementControlKind, Phase } from '../../types';
import {
  BatchFailoverRelocateModal,
  batchFailoverRelocateDependencies,
} from '../modals/app-failover-relocate/batch-failover-relocate-modal';
import {
  ProtectedApplicationsListPage,
  protectedApplicationsListDependencies,
} from './list-page';

const renderWithRouter = (ui: React.ReactElement) =>
  render(ui, { wrapper: MemoryRouter });

const getHTMLElement = (container: HTMLElement, selector: string) => {
  const element = container.querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Element not found: ${selector}`);
  }
  return element;
};

const unableToFindError = 'Unable to find an element';
const failingDRPCName = 'test-drpc-1';
const relocatedDRPCName = 'test-drpc-2';
const drPolicyName = 'test-policy';
const deploymentClusterName = 'test-cluster-2';
const namespaces = ['ns-1', 'ns-2', 'ns-3', 'ns-4'];

let noData = false;
let noFilteredData = false;
let filterDRPC = '';

const resetGlobals = () => {
  noData = false;
  noFilteredData = false;
  filterDRPC = '';
};

const failingDRPC = {
  apiVersion: 'ramendr.openshift.io/v1alpha1',
  kind: 'DRPlacementControl',
  metadata: {
    name: failingDRPCName,
    namespace: 'test',
    uid: 'drpc-uid-1',
    annotations: {
      'drplacementcontrol.ramendr.openshift.io/last-app-deployment-cluster':
        deploymentClusterName,
    },
  },
  spec: {
    action: DRActionType.FAILOVER,
    drPolicyRef: { name: 'test-policy' },
    failoverCluster: 'test-cluster-1',
    preferredCluster: 'test-cluster-2',
    placementRef: { name: 'test-ref' },
    pvcSelector: {},
    protectedNamespaces: namespaces,
    kubeObjectProtection: { captureInterval: '5m' },
  },
  status: {
    lastGroupSyncTime: '2024-03-04T11:38:44Z',
    lastKubeObjectSyncTime: '2024-03-04T11:38:44Z',
    phase: 'FailingOver',
  },
};

const relocatedDRPC: DRPlacementControlKind = {
  apiVersion: 'ramendr.openshift.io/v1alpha1',
  kind: 'DRPlacementControl',
  metadata: {
    name: relocatedDRPCName,
    namespace: 'test',
    uid: 'drpc-uid-2',
    annotations: {
      'drplacementcontrol.ramendr.openshift.io/last-app-deployment-cluster':
        deploymentClusterName,
    },
  },
  spec: {
    action: DRActionType.FAILOVER,
    drPolicyRef: { name: 'test-policy' },
    failoverCluster: 'test-cluster-1',
    preferredCluster: 'test-cluster-2',
    placementRef: { name: 'test-ref' },
    pvcSelector: {},
    protectedNamespaces: namespaces,
    kubeObjectProtection: { captureInterval: '5m' },
  },
  status: {
    lastGroupSyncTime: '2024-03-04T11:38:44Z',
    lastKubeObjectSyncTime: '2024-03-04T11:38:44Z',
    phase: Phase.Relocated,
  },
};

const failingPAV = {
  apiVersion: 'multicluster.odf.openshift.io/v1alpha1',
  kind: 'ProtectedApplicationView',
  metadata: { name: failingDRPCName, namespace: 'test', uid: 'pav-uid-1' },
  spec: { drpcRef: { name: failingDRPCName, namespace: 'test' } },
  status: {
    applicationInfo: {
      type: ApplicationType.Discovered,
      applicationRef: {
        kind: 'DRPlacementControl',
        name: failingDRPCName,
        namespace: 'test',
      },
    },
    placementInfo: {
      placementRef: { name: 'test-ref', kind: 'Placement', namespace: 'test' },
      selectedClusters: ['test-cluster-1', 'test-cluster-2'],
    },
    drInfo: {
      drPolicyRef: { name: drPolicyName },
      drClusters: ['test-cluster-1', 'test-cluster-2'],
      primaryCluster: deploymentClusterName,
      protectedNamespaces: namespaces,
      status: {
        phase: 'FailingOver',
        lastGroupSyncTime: '2024-03-04T11:38:44Z',
      },
    },
  },
};

const relocatedPAV = {
  apiVersion: 'multicluster.odf.openshift.io/v1alpha1',
  kind: 'ProtectedApplicationView',
  metadata: { name: relocatedDRPCName, namespace: 'test', uid: 'pav-uid-2' },
  spec: { drpcRef: { name: relocatedDRPCName, namespace: 'test' } },
  status: {
    applicationInfo: {
      type: ApplicationType.Discovered,
      applicationRef: {
        kind: 'DRPlacementControl',
        name: relocatedDRPCName,
        namespace: 'test',
      },
    },
    placementInfo: {
      placementRef: { name: 'test-ref', kind: 'Placement', namespace: 'test' },
      selectedClusters: ['test-cluster-1', 'test-cluster-2'],
    },
    drInfo: {
      drPolicyRef: { name: drPolicyName },
      drClusters: ['test-cluster-1', 'test-cluster-2'],
      primaryCluster: deploymentClusterName,
      protectedNamespaces: namespaces,
      status: { phase: Phase.Relocated, lastGroupSyncTime: '2024-03-04T11:38:44Z' },
    },
  },
};

const drpcs = [failingDRPC, relocatedDRPC];
const pavs = [failingPAV, relocatedPAV];
const emptyArr: unknown[] = [];
const pavsWithoutFailing = pavs.filter(
  (pav) => pav.metadata.name !== failingDRPCName
);
const pavsWithoutRelocated = pavs.filter(
  (pav) => pav.metadata.name !== relocatedDRPCName
);
const mockOnFilterChange = jest.fn();
jest
  .spyOn(protectedApplicationsListDependencies, 'useListPageFilter')
  .mockImplementation(
    jest.fn(() => {
      if (noData) return [emptyArr, emptyArr, mockOnFilterChange];
      if (noFilteredData) return [pavs, emptyArr, mockOnFilterChange];
      if (filterDRPC === failingDRPCName)
        return [pavs, pavsWithoutFailing, mockOnFilterChange];
      if (filterDRPC === relocatedDRPCName)
        return [pavs, pavsWithoutRelocated, mockOnFilterChange];
      return [pavs, pavs, mockOnFilterChange];
    })
  );
jest
  .spyOn(protectedApplicationsListDependencies, 'useK8sWatchResource')
  .mockImplementation(
    jest.fn(({ kind, groupVersionKind }) => {
      if (noData) return [[], true, ''];
      if (
        groupVersionKind?.group === 'multicluster.odf.openshift.io' &&
        groupVersionKind?.kind === 'ProtectedApplicationView'
      )
        return [pavs, true, ''];
      if (
        kind ===
          `${DRPlacementControlModel.apiGroup}~${DRPlacementControlModel.apiVersion}~${DRPlacementControlModel.kind}` ||
        groupVersionKind?.kind === DRPlacementControlModel.kind
      )
        return [drpcs, true, ''];
      return [[], true, ''];
    })
  );
jest
  .spyOn(protectedApplicationsListDependencies, 'getMCVName')
  .mockImplementation(jest.fn(() => ''));
jest
  .spyOn(protectedApplicationsListDependencies, 'useNavigate')
  .mockImplementation(() => jest.fn());
jest
  .spyOn(protectedApplicationsListDependencies, 'useDROperationAlert')
  .mockImplementation(jest.fn());
jest
  .spyOn(protectedApplicationsListDependencies, 'Link')
  .mockImplementation(jest.fn((props) => <a {...props}>{props.children}</a>));
const mockEmptyRowMessage = jest
  .spyOn(protectedApplicationsListDependencies, 'EmptyRowMessage')
  .mockImplementation(jest.fn(() => null));
const mockNoDataMessage = jest
  .spyOn(protectedApplicationsListDependencies, 'NoDataMessage')
  .mockImplementation(jest.fn(() => null));
jest
  .spyOn(protectedApplicationsListDependencies, 'NamespacesDetails')
  .mockImplementation(
    jest.fn(({ view }) => (
      <div>
        {view?.status?.drInfo?.protectedNamespaces?.map((ns) => (
          <div key={ns}>{ns}</div>
        ))}
      </div>
    ))
  );
jest
  .spyOn(protectedApplicationsListDependencies, 'DRStatusPopover')
  .mockImplementation(jest.fn(() => <div>DR Status</div>));

const mockSelection = {
  onRowSelect: jest.fn(),
  isSelected: jest.fn(() => false),
  isDisabled: jest.fn(() => false),
  isAllPageSelected: false,
  onSelectAllPage: jest.fn(),
  selectedCount: 0,
  eligiblePageCount: 0,
  eligibleTotalCount: 0,
  isPartiallySelected: false,
  onSelectNone: jest.fn(),
  onSelectPage: jest.fn(),
  onSelectAll: jest.fn(),
};
jest
  .spyOn(protectedApplicationsListDependencies, 'getDRPCKey')
  .mockImplementation(
    jest.fn((pav) => `${pav.spec.drpcRef.namespace}/${pav.spec.drpcRef.name}`)
  );
jest
  .spyOn(protectedApplicationsListDependencies, 'useProtectedAppsSelection')
  .mockImplementation(jest.fn(() => mockSelection));
jest
  .spyOn(protectedApplicationsListDependencies, 'getApplicationName')
  .mockImplementation(jest.fn((pav) => pav.metadata.name));
jest
  .spyOn(protectedApplicationsListDependencies, 'getPAVDRPolicyName')
  .mockImplementation(jest.fn(() => drPolicyName));
jest
  .spyOn(protectedApplicationsListDependencies, 'getPrimaryCluster')
  .mockImplementation(jest.fn(() => deploymentClusterName));

// eslint-disable-next-line no-console
const originalError = console.error.bind(console.error);
let consoleSpy: jest.SpyInstance<
  void,
  [message?: any, ...optionalParams: any[]]
>;

const ignoreErrors = () => {
  consoleSpy = jest.spyOn(console, 'error').mockImplementation((...data) => {
    if (!data.toString().includes('ListPageBody.js')) {
      originalError(...data);
    }
  });
};

describe('Test protected applications list page table (ProtectedApplicationsListPage)', () => {
  let user;
  beforeEach(() => {
    user = userEvent.setup();
    resetGlobals();
  });
  afterEach(() => jest.clearAllMocks());
  beforeAll(() => ignoreErrors());
  afterAll(() => consoleSpy.mockRestore());

  it('"NoDataMessage" FC is rendered when no applications are found', async () => {
    noData = true;
    noFilteredData = true;
    renderWithRouter(<ProtectedApplicationsListPage />);

    expect(mockNoDataMessage).toHaveBeenCalled();
    expect(mockEmptyRowMessage).not.toHaveBeenCalled();
  });

  it('"EmptyRowMessage" FC is rendered when applications are found but filtered data is empty', async () => {
    noData = false;
    noFilteredData = true;
    renderWithRouter(<ProtectedApplicationsListPage />);

    expect(mockEmptyRowMessage).toHaveBeenCalled();
    expect(mockNoDataMessage).not.toHaveBeenCalled();
  });

  it('"ComposableTable" FC is rendered, listing all the DRPCs', async () => {
    renderWithRouter(<ProtectedApplicationsListPage />);

    expect(screen.getByText(failingDRPCName)).toBeInTheDocument();
    expect(screen.getByText(relocatedDRPCName)).toBeInTheDocument();
  });

  it('"EnrollApplicationButton" and "PopoverStatus" FCs are rendered, listing different app types', async () => {
    renderWithRouter(<ProtectedApplicationsListPage />);

    const buttonTitle = 'Enroll application';
    const popoverTitle = 'Application types and their enrollment processes';
    const discoveredApps = 'ACM discovered applications';
    const managedApps = 'ACM managed applications';

    expect(screen.getByText(buttonTitle)).toBeInTheDocument();
    await user.click(screen.getByText(buttonTitle));
    expect(screen.getByText(discoveredApps)).toBeInTheDocument();
    expect(screen.getByText(managedApps)).toBeInTheDocument();
    await user.click(screen.getByText(buttonTitle));
    await waitFor(() => {
      expect(screen.queryByText(discoveredApps)).not.toBeVisible();
    });
    await waitFor(() => {
      expect(screen.queryByText(managedApps)).not.toBeInTheDocument();
    });

    expect(screen.getByText(popoverTitle)).toBeInTheDocument();
    expect(screen.getByText(popoverTitle)).toBeEnabled();
  });
});

describe('Test protected applications list page table row (ProtectedAppsTableRow)', () => {
  let user;
  beforeEach(() => {
    user = userEvent.setup();
    resetGlobals();
  });
  afterEach(() => jest.clearAllMocks());
  beforeAll(() => ignoreErrors());
  afterAll(() => consoleSpy.mockRestore());

  it('Table header contains all required columns', async () => {
    renderWithRouter(<ProtectedApplicationsListPage />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getAllByText('DR Status').length).toBeGreaterThan(0);
    expect(screen.getByText('Policy')).toBeInTheDocument();
    expect(screen.getByText('Cluster')).toBeInTheDocument();
  });

  it('"Relocated DRPC" table row contains all required columns', async () => {
    filterDRPC = failingDRPCName;
    const { container } = renderWithRouter(<ProtectedApplicationsListPage />);

    const expandButton = getHTMLElement(
      container,
      '[data-test="expand-button"]'
    );
    expect(expandButton).toBeInTheDocument();

    expect(() => screen.getByText(failingDRPCName)).toThrow(unableToFindError);
    const nameElement = getHTMLElement(container, '[data-label="Name"]');
    expect(nameElement).not.toBeNull();
    expect(nameElement).toHaveTextContent(relocatedDRPCName);
    expect(
      nameElement.querySelector(
        `[data-test='resource-link-${relocatedDRPCName}']`
      )
    ).toHaveAttribute(
      'href',
      `/k8s/ns/${relocatedDRPC.metadata.namespace}/ramendr.openshift.io~v1alpha1~DRPlacementControl/${relocatedDRPCName}`
    );

    const policyElement = getHTMLElement(container, '[data-label="Policy"]');
    expect(policyElement).not.toBeNull();
    expect(policyElement).toHaveTextContent(drPolicyName);
    expect(
      policyElement.querySelector(`[data-test='link-${drPolicyName}']`)
    ).toHaveAttribute('href', `${DR_BASE_ROUTE}/policies?name=${drPolicyName}`);

    expect(container.querySelector('[data-label="Cluster"]')).toHaveTextContent(
      deploymentClusterName
    );

    const kebabButton = screen.getByRole('button', { name: /Kebab toggle/i });
    await user.click(kebabButton);
    expect(screen.getByText('Edit configuration')).toBeVisible();
    expect(screen.getByText('Failover')).toBeVisible();
    expect(screen.getByText('Relocate')).toBeVisible();
  });

  it('"FailingOver DRPC" expands to show namespaces when expand button is clicked', async () => {
    filterDRPC = relocatedDRPCName;
    const { container } = renderWithRouter(<ProtectedApplicationsListPage />);

    expect(() => screen.getByText(relocatedDRPCName)).toThrow(
      unableToFindError
    );
    const nameElement = getHTMLElement(container, '[data-label="Name"]');
    expect(nameElement).toHaveTextContent(failingDRPCName);
    expect(
      nameElement.querySelector(
        `[data-test='resource-link-${failingDRPCName}']`
      )
    ).toHaveAttribute(
      'href',
      `/k8s/ns/${failingDRPC.metadata.namespace}/ramendr.openshift.io~v1alpha1~DRPlacementControl/${failingDRPCName}`
    );

    const expandButton = getHTMLElement(
      container,
      '[data-test="expand-button"] button'
    );
    expect(expandButton).toBeInTheDocument();

    await user.click(expandButton);

    expect(screen.getByText(namespaces[0])).toBeInTheDocument();
    expect(screen.getByText(namespaces[1])).toBeInTheDocument();
    expect(screen.getByText(namespaces[2])).toBeInTheDocument();
    expect(screen.getByText(namespaces[3])).toBeInTheDocument();
  });
});

describe('Test selection mechanics (RHSTOR-6406)', () => {
  const mockUseProtectedAppsSelection = jest.spyOn(
    protectedApplicationsListDependencies,
    'useProtectedAppsSelection'
  );
  let user;
  beforeEach(() => {
    user = userEvent.setup();
    resetGlobals();
    mockUseProtectedAppsSelection.mockReturnValue({ ...mockSelection });
  });
  afterEach(() => jest.clearAllMocks());
  beforeAll(() => ignoreErrors());
  afterAll(() => consoleSpy.mockRestore());

  it('Renders checkboxes for each row', () => {
    renderWithRouter(<ProtectedApplicationsListPage />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(2);
  });

  it('Disabled rows reflect isDisabled from the selection hook', () => {
    mockUseProtectedAppsSelection.mockReturnValue({
      ...mockSelection,
      isDisabled: jest.fn((pav) => pav.metadata.uid === 'pav-uid-1'),
    });
    const { container } = renderWithRouter(<ProtectedApplicationsListPage />);

    const checkboxes = container.querySelectorAll(
      'tbody tr input[type="checkbox"]'
    );

    const failingCheckbox = Array.from(checkboxes).find((checkbox) => {
      const row = checkbox.closest('tr');
      return row?.textContent?.includes(failingDRPCName);
    });

    const relocatedCheckbox = Array.from(checkboxes).find((checkbox) => {
      const row = checkbox.closest('tr');
      return row?.textContent?.includes(relocatedDRPCName);
    });

    if (!(failingCheckbox instanceof HTMLInputElement)) {
      throw new Error('Failing application checkbox was not found');
    }
    if (!(relocatedCheckbox instanceof HTMLInputElement)) {
      throw new Error('Relocated application checkbox was not found');
    }

    expect(failingCheckbox.disabled).toBe(true);
    expect(relocatedCheckbox.disabled).toBe(false);
  });

  it('Failover/Relocate button is disabled when selectedCount is 0', () => {
    renderWithRouter(<ProtectedApplicationsListPage />);

    const button = screen.getByRole('button', { name: /Failover\/Relocate/i });
    expect(button).toBeDisabled();
  });

  it('Failover/Relocate button is enabled when selectedCount > 0', () => {
    mockUseProtectedAppsSelection.mockReturnValue({
      ...mockSelection,
      selectedCount: 1,
    });
    renderWithRouter(<ProtectedApplicationsListPage />);

    const button = screen.getByRole('button', { name: /Failover\/Relocate/i });
    expect(button).toBeEnabled();
  });

  it('Bulk selector dropdown renders with correct options', async () => {
    renderWithRouter(<ProtectedApplicationsListPage />);

    const bulkToggle = screen.getByRole('button', {
      name: /Bulk selection/i,
    });
    await user.click(bulkToggle);

    await waitFor(() => {
      expect(screen.getByText('Select none (0 items)')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Select page/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Select all/)
    ).toBeInTheDocument();
  });
});

describe('Test batch failover/relocate (RHSTOR-6407, RHSTOR-6408)', () => {
  const mockUseProtectedAppsSelection = jest.spyOn(
    protectedApplicationsListDependencies,
    'useProtectedAppsSelection'
  );
  const mockUseModalWrapper = jest.spyOn(
    protectedApplicationsListDependencies,
    'useModalWrapper'
  );
  const mockK8sPatch = jest.spyOn(
    batchFailoverRelocateDependencies,
    'k8sPatch'
  );
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    resetGlobals();
    mockUseProtectedAppsSelection.mockReturnValue({
      ...mockSelection,
      selectedCount: 1,
      isSelected: jest.fn((pav) => pav.metadata.uid === 'pav-uid-2'),
    });
    mockK8sPatch.mockReset().mockResolvedValue({});
  });
  afterEach(() => jest.clearAllMocks());
  beforeAll(() => ignoreErrors());
  afterAll(() => consoleSpy.mockRestore());

  it('Clicking Failover/Relocate button launches the batch modal', async () => {
    const launcherMock = jest.fn();
    mockUseModalWrapper.mockReturnValue(launcherMock);

    renderWithRouter(<ProtectedApplicationsListPage />);
    const button = screen.getByRole('button', { name: /Failover\/Relocate/i });
    await user.click(button);

    await waitFor(() => {
      expect(launcherMock).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isOpen: true,
          extraProps: expect.objectContaining({
            selectedDRPCs: expect.any(Array),
          }),
        })
      );
    });
  });

  it('Batch modal renders two action tiles with Initiate disabled', () => {
    const closeModal = jest.fn();
    render(
      <BatchFailoverRelocateModal
        isOpen={true}
        closeModal={closeModal}
        extraProps={{
          selectedDRPCs: [relocatedDRPC],
          onComplete: jest.fn(),
          onPartialFailure: jest.fn(),
        }}
      />
    );

    expect(
      screen.getByText('Failover or relocate selected applications')
    ).toBeInTheDocument();
    expect(screen.getByText('Failover')).toBeInTheDocument();
    expect(screen.getByText('Relocate')).toBeInTheDocument();

    const initiateButton = screen.getByRole('button', { name: /Initiate/i });
    expect(initiateButton).toBeDisabled();
  });

  it('Selecting a tile enables the Initiate button', async () => {
    render(
      <BatchFailoverRelocateModal
        isOpen={true}
        closeModal={jest.fn()}
        extraProps={{
          selectedDRPCs: [relocatedDRPC],
          onComplete: jest.fn(),
          onPartialFailure: jest.fn(),
        }}
      />
    );

    const relocateCard = screen.getByText('Relocate').closest('.pf-v6-c-card');
    await user.click(relocateCard);

    const initiateButton = screen.getByRole('button', { name: /Initiate/i });
    expect(initiateButton).toBeEnabled();
  });

  it('Cancel closes the modal without side effects', async () => {
    const closeModal = jest.fn();
    const onComplete = jest.fn();

    render(
      <BatchFailoverRelocateModal
        isOpen={true}
        closeModal={closeModal}
        extraProps={{
          selectedDRPCs: [relocatedDRPC],
          onComplete,
          onPartialFailure: jest.fn(),
        }}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(closeModal).toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(mockK8sPatch).not.toHaveBeenCalled();
  });

  it('Initiate shows progress view then patches DRPCs and calls onComplete', async () => {
    let patchResolve: () => void = () => undefined;
    mockK8sPatch.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          patchResolve = resolve;
        })
    );

    const closeModal = jest.fn();
    const onComplete = jest.fn();
    const onPartialFailure = jest.fn();

    render(
      <BatchFailoverRelocateModal
        isOpen={true}
        closeModal={closeModal}
        extraProps={{
          selectedDRPCs: [relocatedDRPC],
          onComplete,
          onPartialFailure,
        }}
      />
    );

    const failoverCard = screen.getByText('Failover').closest('.pf-v6-c-card');
    await user.click(failoverCard);

    const initiateButton = screen.getByRole('button', { name: /Initiate/i });
    await user.click(initiateButton);

    await waitFor(() => {
      expect(
        screen.getByText('Sending failover requests...')
      ).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    patchResolve();

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
      expect(closeModal).toHaveBeenCalled();
      expect(onPartialFailure).not.toHaveBeenCalled();
    });
  });

  it('Partial failure calls onPartialFailure with failed DRPCs', async () => {
    mockK8sPatch.mockRejectedValueOnce(new Error('patch failed'));

    const closeModal = jest.fn();
    const onComplete = jest.fn();
    const onPartialFailure = jest.fn();

    render(
      <BatchFailoverRelocateModal
        isOpen={true}
        closeModal={closeModal}
        extraProps={{
          selectedDRPCs: [relocatedDRPC],
          onComplete,
          onPartialFailure,
        }}
      />
    );

    const relocateCard = screen.getByText('Relocate').closest('.pf-v6-c-card');
    await user.click(relocateCard);

    const initiateButton = screen.getByRole('button', { name: /Initiate/i });
    await user.click(initiateButton);

    await waitFor(() => {
      expect(onPartialFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          action: DRActionType.RELOCATE,
          failedItems: [
            expect.objectContaining({
              drpc: relocatedDRPC,
              errorMessage: 'patch failed',
            }),
          ],
          totalCount: 1,
        })
      );
      expect(onComplete).toHaveBeenCalled();
      expect(closeModal).toHaveBeenCalled();
    });
  });
});
