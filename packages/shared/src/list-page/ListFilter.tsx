import * as React from 'react';
import { getName } from '@odf/shared/selectors';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash-es';
import { SearchInput, SearchInputProps } from '@patternfly/react-core';

type ListFilterProps = {
  data: K8sResourceCommon[];
  loaded: boolean;
  dataFilter?: (resource: K8sResourceCommon) => boolean;
  textInputProps?: Omit<SearchInputProps, 'value' | 'onChange' | 'onClear'>;
  children: (filteredData: K8sResourceCommon[]) => React.ReactNode;
};

export const ListFilter: React.FC<ListFilterProps> = ({
  data,
  loaded,
  dataFilter,
  textInputProps,
  children,
}) => {
  const { t } = useCustomTranslation();
  const [input, setInput] = React.useState('');

  const filteredData = React.useMemo(() => {
    if (!input) return data;
    const resourceFilter =
      dataFilter ||
      ((resource: K8sResourceCommon): boolean =>
        _.toLower(getName(resource)).includes(_.toLower(input)));
    return (data ?? []).filter(resourceFilter);
  }, [input, data, dataFilter]);

  // PF SearchInput onChange may provide a string or a FormEvent;
  // when a FormEvent, currentTarget is the typed HTMLInputElement.
  const onChange = (
    inputValue: string | React.FormEvent<HTMLInputElement>
  ): void =>
    setInput(
      _.isString(inputValue) ? inputValue : inputValue.currentTarget?.value
    );

  return (
    <>
      {loaded && !_.isEmpty(data) && (
        <SearchInput
          {...textInputProps}
          placeholder={textInputProps?.placeholder || t('Search by name...')}
          value={input}
          onChange={onChange}
          onClear={(): void => onChange('')}
        />
      )}
      {children(filteredData)}
    </>
  );
};
