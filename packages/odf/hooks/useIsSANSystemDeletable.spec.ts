import { renderHook } from '@testing-library/react';
import { FileSystemKind } from '../types/scale';
import useIsSANSystemDeletable, {
  useIsSANSystemDeletableDeps,
} from './useIsSANSystemDeletable';

jest
  .spyOn(useIsSANSystemDeletableDeps, 'useK8sWatchResource')
  .mockImplementation(jest.fn());

const useK8sWatchResource = useIsSANSystemDeletableDeps.useK8sWatchResource;

const sanFileSystem = (name: string): FileSystemKind => ({
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
});

const remoteFileSystem = (name: string): FileSystemKind => ({
  apiVersion: 'scale.spectrum.ibm.com/v1beta1',
  kind: 'Filesystem',
  metadata: { name },
  spec: {
    remote: {
      cluster: 'remote-cluster',
      fs: 'remote-fs',
    },
  },
});

describe('useIsSANSystemDeletable', () => {
  it('returns false while filesystems are loading', () => {
    jest.mocked(useK8sWatchResource).mockReturnValue([undefined, false, null]);

    const { result } = renderHook(() => useIsSANSystemDeletable());
    expect(result.current).toBe(false);
  });

  it('returns false when the filesystem watch errors', () => {
    jest
      .mocked(useK8sWatchResource)
      .mockReturnValue([[], true, new Error('failed')]);

    const { result } = renderHook(() => useIsSANSystemDeletable());
    expect(result.current).toBe(false);
  });

  it('returns false when SAN LUN groups exist', () => {
    jest
      .mocked(useK8sWatchResource)
      .mockReturnValue([[sanFileSystem('lun-group-1')], true, null]);

    const { result } = renderHook(() => useIsSANSystemDeletable());
    expect(result.current).toBe(false);
  });

  it('returns true when there are no SAN LUN groups', () => {
    jest
      .mocked(useK8sWatchResource)
      .mockReturnValue([[remoteFileSystem('remote-fs')], true, null]);

    const { result } = renderHook(() => useIsSANSystemDeletable());
    expect(result.current).toBe(true);
  });

  it('returns true when the filesystem list is empty', () => {
    jest.mocked(useK8sWatchResource).mockReturnValue([[], true, null]);

    const { result } = renderHook(() => useIsSANSystemDeletable());
    expect(result.current).toBe(true);
  });

  it('does not throw when filesystems are undefined after load', () => {
    jest.mocked(useK8sWatchResource).mockReturnValue([undefined, true, null]);

    const { result } = renderHook(() => useIsSANSystemDeletable());
    expect(result.current).toBe(true);
  });
});
