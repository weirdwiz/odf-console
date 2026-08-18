import * as React from 'react';
import {
  CheckCircleIcon,
  InfoCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  ArrowCircleUpIcon,
  UnknownIcon,
  SyncAltIcon,
  ResourcesAlmostFullIcon,
  ResourcesFullIcon,
  TimesIcon,
  TimesCircleIcon,
} from '@patternfly/react-icons';
import {
  t_global_icon_color_status_danger_default as dangerColor,
  t_global_color_disabled_100 as disabledColor,
  t_color_blue_40 as blueDefaultColor,
  t_color_gray_50 as grayInfoColor,
  t_color_blue_40 as blueInfoColor,
  t_global_color_status_success_100 as okColor,
  t_global_icon_color_status_warning_default as warningColor,
} from '@patternfly/react-tokens';

export type ColoredIconProps = {
  className?: string;
  title?: string;
};

export const iconsDependencies = {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
  UnknownIcon,
  SyncAltIcon,
  ResourcesFullIcon,
  ResourcesAlmostFullIcon,
  ArrowCircleUpIcon,
};

export const GreenCheckCircleIcon: React.FC<ColoredIconProps> = ({
  className,
  title,
}) => (
  <iconsDependencies.CheckCircleIcon
    data-test="success-icon"
    color={okColor.value}
    className={className}
    title={title}
  />
);

export const RedExclamationCircleIcon: React.FC<ColoredIconProps> = ({
  className,
  title,
}) => (
  <iconsDependencies.ExclamationCircleIcon
    color={dangerColor.value}
    className={className}
    title={title}
  />
);

export const RedExclamationTriangleIcon: React.FC<ColoredIconProps> = ({
  className,
  title,
}) => (
  <iconsDependencies.ExclamationTriangleIcon
    color={dangerColor.value}
    className={className}
    title={title}
  />
);

export const YellowExclamationTriangleIcon: React.FC<ColoredIconProps> = ({
  className,
  title,
}) => (
  <iconsDependencies.ExclamationTriangleIcon
    color={warningColor.value}
    className={className}
    title={title}
  />
);

export const BlueInfoCircleIcon: React.FC<ColoredIconProps> = ({
  className,
  title,
}) => (
  <iconsDependencies.InfoCircleIcon
    color={blueInfoColor.value}
    className={className}
    title={title}
  />
);

export const GrayInfoCircleIcon: React.FC<ColoredIconProps> = ({
  className,
  title,
}) => (
  <iconsDependencies.InfoCircleIcon
    color={grayInfoColor.value}
    className={className}
    title={title}
  />
);

export const GrayUnknownIcon: React.FC<ColoredIconProps> = ({
  className,
  title,
}) => (
  <iconsDependencies.UnknownIcon
    color={disabledColor.value}
    className={className}
    title={title}
  />
);

export const BlueSyncIcon: React.FC<ColoredIconProps> = ({
  className,
  title,
}) => (
  <iconsDependencies.SyncAltIcon
    color={blueInfoColor.value}
    className={className}
    title={title}
  />
);

export const RedResourcesFullIcon: React.FC<ColoredIconProps> = ({
  className,
  title,
}) => (
  <iconsDependencies.ResourcesFullIcon
    color={dangerColor.value}
    className={className}
    title={title}
  />
);

export const YellowResourcesAlmostFullIcon: React.FC<ColoredIconProps> = ({
  className,
  title,
}) => (
  <iconsDependencies.ResourcesAlmostFullIcon
    color={warningColor.value}
    className={className}
    title={title}
  />
);

export const BlueArrowCircleUpIcon: React.FC<ColoredIconProps> = ({
  className,
  title,
}) => (
  <iconsDependencies.ArrowCircleUpIcon
    color={blueDefaultColor.value}
    className={className}
    title={title}
  />
);

export const RedTimesIcon: React.FC<ColoredIconProps> = ({
  className,
  title,
}) => (
  <TimesIcon color={dangerColor.value} className={className} title={title} />
);

export const RedTimesCircleIcon: React.FC<ColoredIconProps> = ({
  className,
  title,
}) => (
  <TimesCircleIcon
    color={dangerColor.value}
    className={className}
    title={title}
  />
);
