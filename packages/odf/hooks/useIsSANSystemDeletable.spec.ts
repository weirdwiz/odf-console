import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import * as TestDependency1 from '@openshift-console/dynamic-plugin-sdk';
import { renderHook } from '@testing-library/react';
import { FileSystemKind } from '../types/scale';
import useIsSANSystemDeletable from './useIsSANSystemDeletable';

jest
  .spyOn(TestDependency1, 'useK8sWatchResource')
  .mockImplementation(jest.fn());

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
    // SAFETY: The jest.Mock test value defines the members exercised by this test.
    (useK8sWatchResource as jest.Mock).mockReturnValue([
      undefined,
      false,
      null,
    ]);

    const { result } = renderHook(() => useIsSANSystemDeletable());
    expect(result.current).toBe(false);
  });

  it('returns false when the filesystem watch errors', () => {
    // SAFETY: The jest.Mock test value defines the members exercised by this test.
    (useK8sWatchResource as jest.Mock).mockReturnValue([
      [],
      true,
      new Error('failed'),
    ]);

    const { result } = renderHook(() => useIsSANSystemDeletable());
    expect(result.current).toBe(false);
  });

  it('returns false when SAN LUN groups exist', () => {
    // SAFETY: The jest.Mock test value defines the members exercised by this test.
    (useK8sWatchResource as jest.Mock).mockReturnValue([
      [sanFileSystem('lun-group-1')],
      true,
      null,
    ]);

    const { result } = renderHook(() => useIsSANSystemDeletable());
    expect(result.current).toBe(false);
  });

  it('returns true when there are no SAN LUN groups', () => {
    // SAFETY: The jest.Mock test value defines the members exercised by this test.
    (useK8sWatchResource as jest.Mock).mockReturnValue([
      [remoteFileSystem('remote-fs')],
      true,
      null,
    ]);

    const { result } = renderHook(() => useIsSANSystemDeletable());
    expect(result.current).toBe(true);
  });

  it('returns true when the filesystem list is empty', () => {
    // SAFETY: The jest.Mock test value defines the members exercised by this test.
    (useK8sWatchResource as jest.Mock).mockReturnValue([[], true, null]);

    const { result } = renderHook(() => useIsSANSystemDeletable());
    expect(result.current).toBe(true);
  });

  it('does not throw when filesystems are undefined after load', () => {
    // SAFETY: The jest.Mock test value defines the members exercised by this test.
    (useK8sWatchResource as jest.Mock).mockReturnValue([undefined, true, null]);

    const { result } = renderHook(() => useIsSANSystemDeletable());
    expect(result.current).toBe(true);
  });
});
