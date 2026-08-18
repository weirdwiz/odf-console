import { S3ProviderType } from '@odf/core/types';
import { useParams } from 'react-router';

const s3ProviderValues: ReadonlySet<string> = new Set(
  Object.values(S3ProviderType)
);

export const useProviderType = (override?: S3ProviderType): S3ProviderType => {
  const { s3Provider } = useParams();

  if (override) return override;

  if (s3Provider && s3ProviderValues.has(s3Provider)) {
    // SAFETY: s3Provider matched one of the S3ProviderType enum values in the Set above.
    return s3Provider as S3ProviderType;
  }
  return S3ProviderType.Noobaa;
};
