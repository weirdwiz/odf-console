import { K8sResourceCondition } from '@odf/shared/types';
import {
  K8sResourceCommon,
  K8sResourceKind,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  NamespacePolicyType,
  NS_NOOBAA_TYPE_MAP,
  NS_PROVIDERS_NOOBAA_MAP,
  SpecProvider,
  SpecType,
} from '../constants';

export type ProviderSecretReference = {
  name: string;
  namespace: string;
};

type BackingStoreProviderConfig = {
  endpoint: string;
  numVolumes: number;
  pvcName: string;
  secret: ProviderSecretReference;
  storageClass: string;
  subPath: string;
  targetBlobContainer: string;
  targetBucket: string;
  [key: string]: string | number | ProviderSecretReference;
};

export type BackingStoreKind = K8sResourceCommon & {
  spec: {
    [key in SpecProvider]: BackingStoreProviderConfig;
  } & {
    type: SpecType;
  };
  status: {
    conditions: K8sResourceCondition[];
  };
};

export type MCGPayload = K8sResourceCommon & {
  spec: NonNullable<K8sResourceKind['spec']> & {
    type: string;
  };
};

export type NsSpecProvider =
  (typeof NS_PROVIDERS_NOOBAA_MAP)[keyof typeof NS_PROVIDERS_NOOBAA_MAP];

export type NsSpecType =
  (typeof NS_NOOBAA_TYPE_MAP)[keyof typeof NS_NOOBAA_TYPE_MAP];

export type NamespaceStoreKind = K8sResourceCommon & {
  spec: {
    [key in NsSpecProvider]: {
      endpoint?: string;
      numVolumes?: number;
      pvcName?: string;
      region?: string;
      secret?: ProviderSecretReference;
      storageClass?: string;
      subPath?: string;
      targetBlobContainer?: string;
      targetBucket?: string;
      [key: string]: string | number | ProviderSecretReference;
    };
  } & {
    type: NsSpecType;
    /** Marks the store for cold-storage archive use (e.g., IBM Deep Archive) */
    archive?: boolean;
  };
  status: {
    conditions: K8sResourceCondition[];
  };
};

export type ObjectBucketClaimKind = K8sResourceCommon & {
  spec: {
    generateBucketName: string;
    storageClassName: string;
    additionalConfig: {
      bucketclass: string;
      'replication-policy': string;
      path: string;
      bucketType: string;
    };
  };
};

export enum PlacementPolicy {
  Spread = 'Spread',
  Mirror = 'Mirror',
}

export enum BucketClassType {
  STANDARD = 'Standard',
  NAMESPACE = 'Namespace',
  VECTOR = 'Vector',
}

export type BucketClassKind = K8sResourceCommon & {
  spec: {
    placementPolicy: {
      tiers: {
        backingStores: string[];
        placement: PlacementPolicy;
      }[];
    };
    namespacePolicy: {
      type: NamespacePolicyType;
      single: {
        resource: string;
      };
      multi: {
        writeResource: string;
        readResources: string[];
      };
      cache: {
        caching: {
          ttl: number;
        };
        hubResource: string;
      };
    };
    vectorPolicy: {
      resource: string;
      vectorDBType: 'lance';
    };
    /** IBM Deep Archive policy for long-term data storage */
    archivePolicy?: {
      deepArchiveResource: string;
    };
  };
  status: {
    conditions: K8sResourceCondition[];
  };
};
