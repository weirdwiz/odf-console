import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { renderHook } from '@testing-library/react-hooks';
import useKernelDevelValidation from './useKernelDevelValidation';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@openshift-console/dynamic-plugin-sdk'),
  useK8sWatchResource: jest.fn(),
}));

describe('useKernelDevelValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state when resources are not loaded', () => {
    (useK8sWatchResource as jest.Mock)
      .mockReturnValueOnce([[], false, null]) // MachineConfigs
      .mockReturnValueOnce([[], false, null]); // MachineConfigPools

    const { result } = renderHook(() => useKernelDevelValidation());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isKernelDevelConfigured).toBe(false);
    expect(result.current.isMCPUpdated).toBe(false);
  });

  it('should detect kernel-devel configured in MachineConfig extensions', () => {
    const machineConfigs = [
      {
        metadata: { name: '99-worker-kernel-devel' },
        spec: { extensions: ['kernel-devel'] },
      },
    ];
    const machineConfigPools = [
      {
        metadata: { name: 'worker' },
        status: {
          conditions: [
            { type: 'Updated', status: 'True' },
            { type: 'Updating', status: 'False' },
            { type: 'Degraded', status: 'False' },
          ],
        },
      },
    ];

    (useK8sWatchResource as jest.Mock)
      .mockReturnValueOnce([machineConfigs, true, null])
      .mockReturnValueOnce([machineConfigPools, true, null]);

    const { result } = renderHook(() => useKernelDevelValidation());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isKernelDevelConfigured).toBe(true);
    expect(result.current.isMCPUpdated).toBe(true);
    expect(result.current.isMCPUpdating).toBe(false);
    expect(result.current.isMCPDegraded).toBe(false);
  });

  it('should detect when kernel-devel is not configured', () => {
    const machineConfigs = [
      {
        metadata: { name: '99-worker-other' },
        spec: { extensions: ['usbguard'] },
      },
    ];
    const machineConfigPools = [
      {
        metadata: { name: 'worker' },
        status: {
          conditions: [
            { type: 'Updated', status: 'True' },
            { type: 'Updating', status: 'False' },
          ],
        },
      },
    ];

    (useK8sWatchResource as jest.Mock)
      .mockReturnValueOnce([machineConfigs, true, null])
      .mockReturnValueOnce([machineConfigPools, true, null]);

    const { result } = renderHook(() => useKernelDevelValidation());

    expect(result.current.isKernelDevelConfigured).toBe(false);
  });

  it('should detect when no MachineConfigs have extensions', () => {
    const machineConfigs = [
      {
        metadata: { name: '99-worker-generated' },
        spec: {},
      },
    ];
    const machineConfigPools = [
      {
        metadata: { name: 'worker' },
        status: {
          conditions: [{ type: 'Updated', status: 'True' }],
        },
      },
    ];

    (useK8sWatchResource as jest.Mock)
      .mockReturnValueOnce([machineConfigs, true, null])
      .mockReturnValueOnce([machineConfigPools, true, null]);

    const { result } = renderHook(() => useKernelDevelValidation());

    expect(result.current.isKernelDevelConfigured).toBe(false);
  });

  it('should detect MCP updating state', () => {
    const machineConfigs = [
      {
        metadata: { name: '99-worker-kernel-devel' },
        spec: { extensions: ['kernel-devel'] },
      },
    ];
    const machineConfigPools = [
      {
        metadata: { name: 'worker' },
        status: {
          conditions: [
            { type: 'Updated', status: 'False' },
            { type: 'Updating', status: 'True' },
            { type: 'Degraded', status: 'False' },
          ],
        },
      },
    ];

    (useK8sWatchResource as jest.Mock)
      .mockReturnValueOnce([machineConfigs, true, null])
      .mockReturnValueOnce([machineConfigPools, true, null]);

    const { result } = renderHook(() => useKernelDevelValidation());

    expect(result.current.isKernelDevelConfigured).toBe(true);
    expect(result.current.isMCPUpdated).toBe(false);
    expect(result.current.isMCPUpdating).toBe(true);
  });

  it('should detect MCP degraded state', () => {
    const machineConfigs = [
      {
        metadata: { name: '99-worker-kernel-devel' },
        spec: { extensions: ['kernel-devel'] },
      },
    ];
    const machineConfigPools = [
      {
        metadata: { name: 'worker' },
        status: {
          conditions: [
            { type: 'Updated', status: 'False' },
            { type: 'Updating', status: 'False' },
            { type: 'Degraded', status: 'True' },
          ],
        },
      },
    ];

    (useK8sWatchResource as jest.Mock)
      .mockReturnValueOnce([machineConfigs, true, null])
      .mockReturnValueOnce([machineConfigPools, true, null]);

    const { result } = renderHook(() => useKernelDevelValidation());

    expect(result.current.isMCPDegraded).toBe(true);
  });

  it('should propagate errors from watched resources', () => {
    const error = new Error('Failed to fetch MachineConfigs');

    (useK8sWatchResource as jest.Mock)
      .mockReturnValueOnce([[], true, error])
      .mockReturnValueOnce([[], true, null]);

    const { result } = renderHook(() => useKernelDevelValidation());

    expect(result.current.error).toBe('Failed to fetch MachineConfigs');
  });

  it('should find kernel-devel among multiple extensions', () => {
    const machineConfigs = [
      {
        metadata: { name: '99-worker-extensions' },
        spec: {
          extensions: ['usbguard', 'kernel-devel', 'sandboxed-containers'],
        },
      },
    ];
    const machineConfigPools = [
      {
        metadata: { name: 'worker' },
        status: {
          conditions: [{ type: 'Updated', status: 'True' }],
        },
      },
    ];

    (useK8sWatchResource as jest.Mock)
      .mockReturnValueOnce([machineConfigs, true, null])
      .mockReturnValueOnce([machineConfigPools, true, null]);

    const { result } = renderHook(() => useKernelDevelValidation());

    expect(result.current.isKernelDevelConfigured).toBe(true);
  });

  it('should handle empty MachineConfig and MachineConfigPool lists', () => {
    (useK8sWatchResource as jest.Mock)
      .mockReturnValueOnce([[], true, null])
      .mockReturnValueOnce([[], true, null]);

    const { result } = renderHook(() => useKernelDevelValidation());

    expect(result.current.isKernelDevelConfigured).toBe(false);
    expect(result.current.isMCPUpdated).toBe(false);
    expect(result.current.isMCPUpdating).toBe(false);
    expect(result.current.isMCPDegraded).toBe(false);
  });
});
