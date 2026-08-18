import * as React from 'react';
import { HealthState } from '@openshift-console/dynamic-plugin-sdk';
import { render, screen } from '@testing-library/react';
import HealthItem, { healthItemDependencies } from './HealthItem';

const classNames = jest.fn();
jest
  .spyOn(healthItemDependencies, 'classNames')
  .mockImplementation((...props) => {
    classNames(props);
    return props[1] ? props[0] + ' ' + props[1] : props[0];
  });

const mockSecondaryStatusComponent = jest.fn((_unused) => {
  return <div data-test-id="mocked-secondary-status" />;
});
jest
  .spyOn(healthItemDependencies, 'SecondaryStatus')
  .mockImplementation((props) => mockSecondaryStatusComponent(props));

const mockPopOverComponent = jest.fn((_unused) => {
  return <div data-test-id="mocked-pop-over" />;
});

const mockButtonComponent = jest.fn((_unused) => {
  return <div data-test-id="mocked-button" />;
});
jest
  .spyOn(healthItemDependencies, 'Popover')
  .mockImplementation((props) => mockPopOverComponent(props));
jest
  .spyOn(healthItemDependencies, 'Button')
  .mockImplementation((props) => mockButtonComponent(props));
// SAFETY: Test-only partial mock; only OK and UNKNOWN states are exercised, so the incomplete mapping is safe for these tests.
healthItemDependencies.healthStateMapping = {
  [HealthState.OK]: {
    icon: 'unit-test-ok-icon',
  },
  [HealthState.UNKNOWN]: {
    icon: 'unit-test-unknown-icon',
  },
} as any;
jest
  .spyOn(healthItemDependencies, 'healthStateMessage')
  .mockImplementation(() => 'mocked-health-state-message');

const title = 'unit-tests';

describe('tests for document elements of health item component', () => {
  it('should render only the title when in loading', () => {
    render(<HealthItem title={title} state={HealthState.LOADING} />);
    expect(screen.getByText(`${title}`)).toBeInTheDocument();
  });
  it('should not render popover when in loading', () => {
    const { container } = render(
      <HealthItem title={title} state={HealthState.LOADING} />
    );
    expect(
      container.querySelector('[data-test-id="mocked-pop-over"]')
    ).toBeNull();
    expect(mockPopOverComponent).not.toHaveBeenCalled();
  });
  it('should not render the secondary status when in loading', () => {
    const { container } = render(
      <HealthItem title={title} state={HealthState.LOADING} />
    );
    expect(
      container.querySelector('[data-test-id="mocked-secondary-status"]')
    ).toBeNull();
  });
  it('should not render the icon status if no icon set to true', () => {
    const { container } = render(
      <HealthItem title={title} noIcon={true} state={HealthState.OK} />
    );
    expect(
      container.querySelector(`[data-test="${title}-health-item-icon"]`)
    ).toBeNull();
  });
  it('should render the status icon if no icon is left default as false and no icon is passed', () => {
    const { container } = render(
      <HealthItem title={title} state={HealthState.OK} />
    );
    expect(
      container.querySelector(`[data-test="${title}-health-item-icon"]`)
    ).toHaveTextContent('unit-test-ok-icon');
  });
  it('should render the default unknown icon if no icon is left default as false and no icon and state is passed', () => {
    const { container } = render(<HealthItem title={title} />);
    expect(
      container.querySelector(`[data-test="${title}-health-item-icon"]`)
    ).toHaveTextContent('unit-test-unknown-icon');
  });
  it('should render the passed icon if no icon is left default as false and a icon node is passed', () => {
    const { container } = render(
      <HealthItem
        title={title}
        icon={<div data-test="passed-health-item-icon" />}
      />
    );
    expect(
      container.querySelector(`[data-test="passed-health-item-icon"]`)
    ).toBeTruthy();
  });
  it('should not render the default icon if no icon is left default as false and a icon node is passed', () => {
    const { container } = render(
      <HealthItem
        title={title}
        icon={<div data-test="passed-health-item-icon" />}
      />
    );
    expect(
      container.querySelector(`[data-test="${title}-health-item-icon"]`)
    ).toBeNull();
  });
  it('should not render popover when no children is passed on', () => {
    const { container } = render(
      <HealthItem title={title} state={HealthState.OK} />
    );
    expect(
      container.querySelector('[data-test-id="mocked-pop-over"]')
    ).toBeNull();
    expect(mockPopOverComponent).not.toHaveBeenCalled();
  });
  it('should have popover when children is passed on and state is not in loading', () => {
    const { container } = render(
      <HealthItem title={title} state={HealthState.OK}>
        <div data-test-id="mocked-popover-content" />
      </HealthItem>
    );
    expect(
      container.querySelector('[data-test-id="mocked-pop-over"]')
    ).toBeTruthy();
    expect(mockPopOverComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        enableFlip: true,
        maxWidth: '21rem',
        headerContent: undefined,
        position: 'top',
        bodyContent: <div data-test-id="mocked-popover-content" />,
      })
    );
  });
  it('should pass on the popup title to the popover', () => {
    const { container } = render(
      <HealthItem
        title={title}
        state={HealthState.OK}
        popupTitle="unit-test-popup-title"
      >
        <div data-test-id="mocked-popover-content" />
      </HealthItem>
    );
    expect(
      container.querySelector('[data-test-id="mocked-pop-over"]')
    ).toBeTruthy();
    expect(mockPopOverComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        headerContent: 'unit-test-popup-title',
      })
    );
  });
  it('should pass on the width instead of default to the popover', () => {
    const { container } = render(
      <HealthItem title={title} state={HealthState.OK} maxWidth="100px">
        <div data-test-id="mocked-popover-content" />
      </HealthItem>
    );
    expect(
      container.querySelector('[data-test-id="mocked-pop-over"]')
    ).toBeTruthy();
    expect(mockPopOverComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        maxWidth: '100px',
      })
    );
  });
  it('should not display secondary status when disable message is true', () => {
    const { container } = render(
      <HealthItem title={title} state={HealthState.OK} disableDetails={true} />
    );
    expect(
      container.querySelector('[data-test-id="mocked-secondary-status"]')
    ).toBeNull();
  });
  it('should display secondary status with default when disable message is false, message is not passed and status is not loading', () => {
    const { container } = render(
      <HealthItem title={title} state={HealthState.OK} disableDetails={false} />
    );
    expect(
      container.querySelector('[data-test-id="mocked-secondary-status"]')
    ).toBeTruthy();
    expect(mockSecondaryStatusComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'mocked-health-state-message',
      })
    );
  });
  it('should display secondary status with passed message when disable message is false and status is not loading', () => {
    const { container } = render(
      <HealthItem
        title={title}
        state={HealthState.OK}
        disableDetails={false}
        details={'unit-test-passed-message'}
      />
    );
    expect(
      container.querySelector('[data-test-id="mocked-secondary-status"]')
    ).toBeTruthy();
    expect(mockSecondaryStatusComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'unit-test-passed-message',
      })
    );
  });
});

describe('tests for css classes for elements of health item component', () => {
  it('should have health item css class at root level', () => {
    const { container } = render(<HealthItem title={title} />);
    expect(
      container.querySelector(`[data-item-id="${title}-health-item"]`)
    ).toHaveClass('co-status-card__health-item');
    expect(classNames).toHaveBeenCalledWith(['co-status-card__health-item']);
  });
  it('should pass css class passed on as param to the component', () => {
    const { container } = render(
      <HealthItem
        title={title}
        state={HealthState.LOADING}
        className={'unit-test-css-class'}
      />
    );
    expect(
      container.querySelector(`[data-item-id="${title}-health-item"]`)
    ).toHaveClass('unit-test-css-class');
    expect(classNames).toHaveBeenCalledWith([
      'co-status-card__health-item',
      'unit-test-css-class',
    ]);
  });
  it('should check whether we have the loading class in case of loading', () => {
    const { container } = render(
      <HealthItem title={title} state={HealthState.LOADING} />
    );
    expect(container.querySelector('.skeleton-health')).toBeTruthy();
    expect(container.querySelector('.pf-v6-u-screen-reader')).toBeTruthy();
  });
  it('should check the css for the icon displayed', () => {
    const { container } = render(<HealthItem title={title} />);
    expect(
      container.querySelector(`[data-test="${title}-health-item-icon"]`)
    ).toHaveClass('co-dashboard-icon');
  });
  it('should check the css for the secondary status', () => {
    render(
      <HealthItem title={title} state={HealthState.OK} disableDetails={false} />
    );
    expect(mockSecondaryStatusComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'co-status-card__health-item-text',
      })
    );
  });
});
