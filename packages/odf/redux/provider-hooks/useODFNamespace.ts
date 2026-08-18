import * as React from 'react';
import { DEFAULT_STORAGE_NAMESPACE as FALLBACK_NAMESPACE } from '@odf/shared/constants';
import {
  SubscriptionModel,
  ClusterServiceVersionModel,
} from '@odf/shared/models';
import { getNamespace } from '@odf/shared/selectors';
import { SubscriptionKind, ClusterServiceVersionKind } from '@odf/shared/types';
import { isAbortError } from '@odf/shared/utils';
import {
  k8sList,
  k8sGet,
  SetFeatureFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import { useODFNamespaceDispatch } from '../dispatchers';

const ODF_SUBSCRIPTION_NAME = 'odf-operator';
const CLIENT_SUBSCRIPTION_NAME = 'ocs-client-operator';

const getSpecName = (resource: SubscriptionKind) => resource?.spec?.name;

export const FDF_FLAG = 'FDF_FLAG'; // Based on whether installed operator is ODF or FDF

const namespaceDetector = async (
  maxAttempt = 5,
  attempt = 1
): Promise<[string, boolean]> => {
  try {
    const subscriptionResponse = await k8sList<SubscriptionKind>({
      model: SubscriptionModel,
      queryParams: { ns: null },
    });
    const subscriptions = Array.isArray(subscriptionResponse)
      ? subscriptionResponse
      : subscriptionResponse.items;
    const odfSubscription = subscriptions.find(
      (subscription) => getSpecName(subscription) === ODF_SUBSCRIPTION_NAME
    );

    if (odfSubscription) {
      const namespace = getNamespace(odfSubscription);
      if (!namespace) throw new Error('ODF install namespace not found');

      // ToDo: Remove in z-stream (https://bugzilla.redhat.com/show_bug.cgi?id=2294383)
      const csv = await k8sGet<ClusterServiceVersionKind>({
        model: ClusterServiceVersionModel,
        name: odfSubscription.status?.installedCSV,
        ns: namespace,
      });
      const isFDF = !['redhat', 'red hat'].includes(
        csv.spec?.provider?.name?.toLowerCase()
      );
      return [namespace, isFDF];
    }

    const clientSubscription = subscriptions.find(
      (subscription) =>
        getSpecName(subscription) === CLIENT_SUBSCRIPTION_NAME
    );
    const namespace = getNamespace(clientSubscription);
    if (!namespace) throw new Error('ODF install namespace not found');
    return [namespace, false];
  } catch (error) {
    if (attempt <= maxAttempt && !isAbortError(error)) {
      return namespaceDetector(maxAttempt, attempt + 1);
    }
    throw error;
  }
};

export const useODFNamespace = (setFlag: SetFeatureFlag): void => {
  const dispatch = useODFNamespaceDispatch();

  React.useEffect(() => {
    namespaceDetector()
      .then(([ns, isFDF]) => {
        dispatch({
          odfNamespace: ns,
          isODFNsLoaded: true,
          odfNsLoadError: undefined,
        });
        setFlag(FDF_FLAG, isFDF);
      })
      /**
       * ODF can be installed in any namespace, still recommended namespace is "openshift-storage".
       * Using it as a fallback alongside storing the error object to the redux store,
       * up to the consumer component what action to take (stick with the fallback or show an error to the user).
       */
      .catch((err) => {
        dispatch({
          odfNamespace: FALLBACK_NAMESPACE,
          isODFNsLoaded: true,
          odfNsLoadError: err,
        });
        setFlag(FDF_FLAG, false);
      });
  }, [dispatch, setFlag]);
};
