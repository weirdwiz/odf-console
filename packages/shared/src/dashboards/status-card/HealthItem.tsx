import * as React from 'react';
import SecondaryStatus from '@odf/shared/status/SecondaryStatus';
import { HealthState } from '@openshift-console/dynamic-plugin-sdk';
import classNames from 'classnames';
import { Button, Popover, PopoverPosition } from '@patternfly/react-core';
import { useCustomTranslation } from '../../useCustomTranslationHook';
import { healthStateMapping, healthStateMessage } from './states';

export const healthItemDependencies = {
  classNames,
  SecondaryStatus: (props: React.ComponentProps<typeof SecondaryStatus>) => (
    <SecondaryStatus {...props} />
  ),
  Popover: (props: React.ComponentProps<typeof Popover>) => (
    <Popover {...props} />
  ),
  Button: (props: React.ComponentProps<typeof Button>) => <Button {...props} />,
  healthStateMapping,
  healthStateMessage,
};

export type HealthItemProps = {
  className?: string;
  title: string;
  details?: string;
  state?: HealthState;
  popupTitle?: string;
  noIcon?: boolean;
  icon?: React.ReactNode;
  maxWidth?: string;
  disableDetails?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
};

const HealthItemIcon: React.FC<HealthItemIconProps> = ({ state, dataTest }) => (
  <div data-test={dataTest} className="co-dashboard-icon">
    {
      (
        healthItemDependencies.healthStateMapping[state] ||
        healthItemDependencies.healthStateMapping[HealthState.UNKNOWN]
      ).icon
    }
  </div>
);

// eslint-disable-next-line react/display-name
const HealthItem: React.FC<HealthItemProps> = React.memo(
  ({
    className,
    state,
    title,
    details,
    popupTitle,
    noIcon = false,
    icon,
    children,
    maxWidth,
    disableDetails = false,
    onClick,
  }) => {
    const { t } = useCustomTranslation();

    const detailMessage = !disableDetails
      ? details || healthItemDependencies.healthStateMessage(state, t)
      : '';

    return (
      <div
        className={healthItemDependencies.classNames(
          'co-status-card__health-item',
          className
        )}
        data-item-id={`${title}-health-item`}
      >
        {state === HealthState.LOADING ? (
          <div className="skeleton-health">
            <span className="pf-v6-u-screen-reader">
              {t('Loading {{title}} status', { title })}
            </span>
          </div>
        ) : (
          !noIcon &&
          (icon || (
            <HealthItemIcon
              state={state}
              dataTest={`${title}-health-item-icon`}
            />
          ))
        )}
        <div>
          <span className="co-status-card__health-item-text">
            {(React.Children.toArray(children).length || onClick) &&
            state !== HealthState.LOADING ? (
              !onClick ? (
                <healthItemDependencies.Popover
                  position={PopoverPosition.top}
                  headerContent={popupTitle}
                  bodyContent={children}
                  enableFlip
                  maxWidth={maxWidth || '21rem'}
                >
                  <healthItemDependencies.Button
                    variant="link"
                    isInline
                    className="co-status-card__popup"
                    data-test="health-popover-link"
                  >
                    {title}
                  </healthItemDependencies.Button>
                </healthItemDependencies.Popover>
              ) : (
                <healthItemDependencies.Button
                  variant="link"
                  isInline
                  className="co-status-card__popup"
                  data-test="health-popover-link"
                  onClick={onClick}
                >
                  {title}
                </healthItemDependencies.Button>
              )
            ) : (
              title
            )}
          </span>
          {state !== HealthState.LOADING && detailMessage && (
            <healthItemDependencies.SecondaryStatus
              status={detailMessage}
              className="co-status-card__health-item-text"
              dataStatusID={`${title}-secondary-status`}
            />
          )}
        </div>
      </div>
    );
  }
);

export default HealthItem;

type HealthItemIconProps = {
  state?: HealthState;
  dataTest?: string;
};
