import {
  k8sCreate,
  k8sGet,
  K8sModel,
  K8sResourceCommon,
  k8sUpdate,
} from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash-es';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type CreateOrUpdateMutationDetails = {
  isUpdated?: boolean;
};

export async function createOrUpdate<T extends K8sResourceCommon>({
  model,
  name,
  namespace,
  mutate,
  maxRetries = 3,
  mutationDetails,
}: {
  model: K8sModel;
  name: string;
  namespace?: string;
  mutate: (obj: T | null) => T;
  maxRetries?: number;
  mutationDetails?: CreateOrUpdateMutationDetails;
}): Promise<T> {
  let lastError: unknown;

  const retryError = () =>
    new Error(
      `Failed to createOrUpdate ${model.kind} ${name} after ${maxRetries} attempts. Last error: ${lastError}`
    );

  const runAttempt = async (attempt: number): Promise<T> => {
    try {
      const current = await k8sGet<T>({ model, name, ns: namespace });
      const updated = mutate(current);

      updated.metadata = {
        ...current.metadata,
        ...updated.metadata,

        name: current.metadata?.name,
        namespace: current.metadata?.namespace,
        uid: current.metadata?.uid,
        resourceVersion: current.metadata?.resourceVersion,
        creationTimestamp: current.metadata?.creationTimestamp,
        generation: current.metadata?.generation,

        ...(current.metadata?.deletionTimestamp && {
          deletionTimestamp: current.metadata.deletionTimestamp,
          deletionGracePeriodSeconds:
            current.metadata.deletionGracePeriodSeconds,
        }),

        ...(current.metadata?.managedFields && {
          managedFields: current.metadata.managedFields,
        }),
      };

      const result = await k8sUpdate<T>({ model, data: updated });
      if (mutationDetails) {
        mutationDetails.isUpdated = true;
      }
      return result;
    } catch (error) {
      lastError = error;

      if (_.get(error, 'response.status') === 404) {
        try {
          const fresh = mutate(null);
          const result = await k8sCreate<T>({ model, data: fresh });
          if (mutationDetails) {
            mutationDetails.isUpdated = false;
          }
          return result;
        } catch (createError) {
          const status = _.get(createError, 'response.status');
          if (![400, 401, 403, 422].includes(status) && status < 500) {
            const nextAttempt = attempt + 1;
            if (nextAttempt >= maxRetries) throw retryError();
            return runAttempt(nextAttempt);
          }
          throw createError;
        }
      }

      const status = _.get(error, 'response.status');
      // Retry on 4xx errors other than 400, 401, 403, 422 and all 5xx errors
      if (![400, 401, 403, 422].includes(status) && status < 500) {
        const nextAttempt = attempt + 1;
        if (nextAttempt >= maxRetries) throw retryError();
        await delay(100 * 2 ** nextAttempt);
        return runAttempt(nextAttempt);
      }

      throw error;
    }
  };

  return runAttempt(0);
}
