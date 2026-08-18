import { StorageClusterKind } from '@odf/shared/types/storage';

export type CommonModalProps<T = {}> = {
  isOpen: boolean;
  closeModal: () => void;
  extraProps?: T;
};

export type StorageClusterActionModalProps = CommonModalProps<{
  storageCluster: StorageClusterKind;
}>;
