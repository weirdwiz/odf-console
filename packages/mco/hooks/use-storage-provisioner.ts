import * as React from 'react';
import { SearchResultItemType } from '@odf/mco/types';
import { CEPH_PROVISIONERS, IBM_PROVISIONERS } from '@odf/shared';
import { isObject, isString } from 'lodash-es';
import { queryStorageClassesUsingClusterNames } from '../utils';
import { useACMSafeFetch } from './acm-safe-fetch';

type StorageClassSearchItem = SearchResultItemType & {
  provisioner: string;
};

const isStorageClassSearchItem = (
  item: SearchResultItemType
): item is StorageClassSearchItem =>
  isObject(item) &&
  'apiversion' in item &&
  isString(item.apiversion) &&
  'kind' in item &&
  isString(item.kind) &&
  'cluster' in item &&
  isString(item.cluster) &&
  'name' in item &&
  isString(item.name) &&
  'created' in item &&
  isString(item.created) &&
  'label' in item &&
  isString(item.label) &&
  '_uid' in item &&
  isString(item._uid) &&
  'provisioner' in item &&
  isString(item.provisioner);

export type Provider = { displayName: string; count: number };
export type ClusterProviders = {
  cluster: string;
  providers: Provider[];
};

export function useStorageProvisioners(clusters: string[]) {
  const searchQuery = React.useMemo(
    () => queryStorageClassesUsingClusterNames(clusters),
    [clusters]
  );
  const [result, error, loaded] = useACMSafeFetch(searchQuery);

  const rawItems = React.useMemo<
    Array<{ cluster: string; name: string; provisioner: string }>
  >(() => {
    return (
      result?.data?.searchResult
        ?.flatMap((searchResult) => searchResult.items || [])
        .filter(isStorageClassSearchItem)
        .map(({ cluster, name, provisioner }) => ({
          cluster,
          name,
          provisioner,
        })) ?? []
    );
  }, [result]);

  const itemsByCluster = React.useMemo<
    Record<string, Array<{ name: string; provisioner: string }>>
  >(() => {
    const initialItemsByCluster: Record<
      string,
      Array<{ name: string; provisioner: string }>
    > = {};
    return rawItems.reduce(
      (acc, { cluster, name, provisioner }) => {
        if (!acc[cluster]) {
          acc[cluster] = [];
        }
        acc[cluster].push({ name, provisioner });
        return acc;
      },
      initialItemsByCluster
    );
  }, [rawItems]);

  const providersByCluster = React.useMemo<ClusterProviders[]>(() => {
    if (!loaded) return [];

    const supportedProvisioners = [...CEPH_PROVISIONERS, ...IBM_PROVISIONERS];

    return Object.entries(itemsByCluster).map(([cluster, items]) => {
      const odfCount = items.filter((i) =>
        supportedProvisioners.includes(i.provisioner)
      ).length;

      const tpMap = new Map<string, number>();
      items.forEach(({ provisioner }) => {
        if (!supportedProvisioners.includes(provisioner)) {
          tpMap.set(provisioner, (tpMap.get(provisioner) || 0) + 1);
        }
      });

      const provs: Provider[] = [];
      if (odfCount > 0) {
        provs.push({ displayName: 'Data Foundation', count: odfCount });
      }
      tpMap.forEach((cnt, prov) =>
        provs.push({ displayName: prov, count: cnt })
      );

      return { cluster, providers: provs };
    });
  }, [loaded, itemsByCluster]);

  return {
    providersByCluster,
    count: providersByCluster.length,
    loaded,
    error,
  };
}
