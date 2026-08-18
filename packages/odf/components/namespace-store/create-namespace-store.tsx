import * as React from 'react';
import { useODFNamespaceSelector } from '@odf/core/redux';
import { NooBaaNamespaceStoreModel } from '@odf/shared';
import { getName } from '@odf/shared/selectors';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { referenceForModel } from '@odf/shared/utils';
import { useParams, useNavigate } from 'react-router';
import { Title } from '@patternfly/react-core';
import NamespaceStoreForm from './namespace-store-form';
import '../mcg-endpoints/noobaa-provider-endpoints.scss';
import '../../style.scss';

export const createNamespaceStoreDeps = {
  // SAFETY: The deps wrapper delegates to NamespaceStoreForm; the cast preserves the component type for test spying.
  NamespaceStoreForm: NamespaceStoreForm as typeof NamespaceStoreForm,
  useODFNamespaceSelector,
  // SAFETY: The deps wrapper delegates to useParams; the cast preserves the generic signature for test spying.
  useParams: useParams as typeof useParams,
  // SAFETY: The deps wrapper delegates to useNavigate; the cast preserves the concrete return type for test spying.
  useNavigate: useNavigate as typeof useNavigate,
};

const CreateNamespaceStore: React.FC<{}> = () => {
  const { t } = useCustomTranslation();

  const { odfNamespace } = createNamespaceStoreDeps.useODFNamespaceSelector();

  const { ns } = createNamespaceStoreDeps.useParams();
  const namespace = ns || odfNamespace;

  const navigate = createNamespaceStoreDeps.useNavigate();
  const onCancel = () => navigate(-1);

  return (
    <>
      <div className="odf-create-operand__header">
        <Title
          size="2xl"
          headingLevel="h1"
          className="odf-create-operand__header-text"
        >
          {t('Create NamespaceStore ')}
        </Title>
        <p className="help-block">
          {t(
            'Represents an underlying storage to be used as read or write target for the data in the namespace buckets.'
          )}
        </p>
      </div>
      <createNamespaceStoreDeps.NamespaceStoreForm
        onCancel={onCancel}
        redirectHandler={(resources) => {
          const lastIndex = resources.length - 1;
          const resourcePath = `${referenceForModel(
            NooBaaNamespaceStoreModel
          )}/${getName(resources[lastIndex])}`;
          navigate(`/odf/resource/${resourcePath}`);
        }}
        namespace={namespace}
        className="nb-endpoints-page-form__short"
      />
    </>
  );
};

export default CreateNamespaceStore;
