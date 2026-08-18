import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import * as TestDependency1 from '@openshift-console/dynamic-plugin-sdk';
import { renderHook } from '@testing-library/react';
import { FileSystemKind } from '../types/scale';
import useIsRemoteClusterDeletable from './useIsRemoteClusterDeletable';

jest
  .spyOn(TestDependency1, 'useK8sWatchResource')
  .mockImplementation(jest.fn());

const remoteFileSystem = (
  name: string,
  remoteClusterName: string
): FileSystemKind => ({
  apiVersion: 'scale.spectrum.ibm.com/v1beta1',
  kind: 'Filesystem',
  metadata: { name },
  spec: {
    remote: {
      cluster: remoteClusterName,
      fs: 'remote-fs',
    },
  },
});

describe('useIsRemoteClusterDeletable', () => {
  it('returns false while filesystems are loading', () => {
    jest.mocked(useK8sWatchResource).mockReturnValue([undefined, false, null]);

    const { result } = renderHook(() =>
      useIsRemoteClusterDeletable('remote-cluster')
    );

    expect(result.current).toBe(false);
  });

  it('returns false when the filesystem watch errors', () => {
    jest
      .mocked(useK8sWatchResource)
      .mockReturnValue([[], true, new Error('failed')]);

    const { result } = renderHook(() =>
      useIsRemoteClusterDeletable('remote-cluster')
    );

    expect(result.current).toBe(false);
  });

  it('returns false when the remote cluster name is unavailable', () => {
    jest.mocked(useK8sWatchResource).mockReturnValue([[], true, null]);

    const { result } = renderHook(() => useIsRemoteClusterDeletable(''));

    expect(result.current).toBe(false);
  });

  it('returns false when filesystems reference the remote cluster', () => {
    jest
      .mocked(useK8sWatchResource)
      .mockReturnValue([
        [remoteFileSystem('remote-fs', 'remote-cluster')],
        true,
        null,
      ]);

    const { result } = renderHook(() =>
      useIsRemoteClusterDeletable('remote-cluster')
    );

    expect(result.current).toBe(false);
  });

  it('returns true when filesystems reference a different remote cluster', () => {
    jest
      .mocked(useK8sWatchResource)
      .mockReturnValue([
        [remoteFileSystem('remote-fs', 'other-cluster')],
        true,
        null,
      ]);

    const { result } = renderHook(() =>
      useIsRemoteClusterDeletable('remote-cluster')
    );

    expect(result.current).toBe(true);
  });

  it('returns true when the filesystem list is empty', () => {
    jest.mocked(useK8sWatchResource).mockReturnValue([[], true, null]);

    const { result } = renderHook(() =>
      useIsRemoteClusterDeletable('remote-cluster')
    );

    expect(result.current).toBe(true);
  });
});
