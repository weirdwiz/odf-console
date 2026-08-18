import { FileSystemKind } from '@odf/core/types/scale';
import { FileSystemModel } from '@odf/shared';
import { referenceForModel } from '@odf/shared/utils';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { filterScaleFileSystems } from '../components/ibm-common/utils';

export const useIsRemoteClusterDeletableDeps = {
  // SAFETY: The deps wrapper delegates to useK8sWatchResource; the cast preserves the generic signature for test spying.
  useK8sWatchResource: useK8sWatchResource as typeof useK8sWatchResource,
};

const useIsRemoteClusterDeletable = (remoteClusterName: string): boolean => {
  const [filesystems, filesystemsLoaded, filesystemsError] =
    useIsRemoteClusterDeletableDeps.useK8sWatchResource<FileSystemKind[]>({
      kind: referenceForModel(FileSystemModel),
      isList: true,
      namespaced: false,
    });

  if (!remoteClusterName || !filesystemsLoaded || filesystemsError) {
    return false;
  }

  return (
    filterScaleFileSystems(filesystems ?? [], remoteClusterName).length === 0
  );
};

export default useIsRemoteClusterDeletable;
