import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash-es';
import { Alert, AlertGroup } from '@patternfly/react-core';
import { useCustomTranslation } from '../useCustomTranslationHook';
import { LoadingInline } from './Loading';

const injectDisabled = (children: React.ReactChild, disabled) => {
  return React.Children.map(children, (c) => {
    // SAFETY: React.Children.map yields ReactNode; _.isObject filters
    // primitives, and .type === 'button' confirms it is a ReactElement.
    if (!_.isObject(c) || (c as React.ReactElement).type !== 'button') {
      return c;
    }

    // SAFETY: Guarded by the isObject + .type check above.
    return React.cloneElement(c as React.ReactElement, {
      disabled: (c as React.ReactElement).props.disabled || disabled,
    });
  });
};

const ErrorMessage = ({ message }) => {
  const { t } = useCustomTranslation();
  return (
    <Alert
      isInline
      className="co-alert co-alert--scrollable"
      variant="danger"
      title={t('An error occurred')}
    >
      <div className="co-pre-line">{message}</div>
    </Alert>
  );
};
const InfoMessage = ({ message }) => (
  <Alert isInline className="co-alert" variant="info" title={message} />
);
const SuccessMessage = ({ message }) => (
  <Alert isInline className="co-alert" variant="success" title={message} />
);

export const ButtonBar: React.FC<ButtonBarProps> = ({
  children,
  className,
  errorMessage,
  infoMessage,
  successMessage,
  inProgress = false,
}) => {
  // SAFETY: injectDisabled expects the deprecated ReactChild type;
  // children is ReactNode, so the cast narrows for that API.
  const disabledChildren = injectDisabled(
    children as React.ReactChild,
    inProgress
  );
  return (
    <div className={classNames(className, 'co-m-btn-bar')}>
      <AlertGroup
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions text"
      >
        {successMessage && <SuccessMessage message={successMessage} />}
        {errorMessage && <ErrorMessage message={errorMessage} />}
        {disabledChildren}
        {inProgress && <LoadingInline />}
        {infoMessage && <InfoMessage message={infoMessage} />}
      </AlertGroup>
    </div>
  );
};

type ButtonBarProps = {
  successMessage?: string;
  errorMessage: React.ReactNode;
  infoMessage?: string;
  inProgress?: boolean;
  className?: string;
  children?: React.ReactNode;
};
