import { S3ProviderType } from '@odf/core/types';
import { useParams } from 'react-router';

export const useProviderType = (override?: S3ProviderType): S3ProviderType => {
  const { s3Provider } = useParams();

  if (override) return override;

  // SAFETY: Object.values(S3ProviderType) contains only entries produced for the string[] contract.
  const allTypes = Object.values(S3ProviderType) as string[];
  // SAFETY: s3Provider comes from the owner of the S3ProviderType contract used at this boundary.
  return allTypes.includes(s3Provider)
    ? (s3Provider as S3ProviderType)
    : S3ProviderType.Noobaa;
};
