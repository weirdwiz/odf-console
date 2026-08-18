import React from 'react';
import { PersistentVolumeClaimModel } from '@odf/shared/models';
import { render } from '@testing-library/react';
import { BreakdownCardBody, BreakdownBodyProps } from './breakdown-body';
import * as TestDependency3 from './breakdown-capacity';
import * as TestDependency4 from './breakdown-chart';
import * as TestDependency2 from './breakdown-loading';
import * as TestDependency1 from './utils';

const mockHumanize = jest.fn((value: string) => ({ string: `${value} MB` }));
jest
  .spyOn(TestDependency1, 'getLegends')
  .mockImplementation(jest.fn(() => ['Legend1', 'Legend2', 'Available']));
jest.spyOn(TestDependency1, 'addAvailable').mockImplementation(
  jest.fn((_unused) => {
    return [
      { label: 'Label1', data: [10, 20, 30] },
      { label: 'Label2', data: [15, 25, 35] },
    ];
  })
);
jest
  .spyOn(TestDependency2, 'BreakdownChartLoading')
  .mockImplementation(() => (
    <div data-test-id="mocked-breakdown-chart-loading" />
  ));

const mockTotalCapacityBody = jest.fn((_unused) => {
  return <div data-test-id="mocked-total-capacity-body" />;
});
jest
  .spyOn(TestDependency3, 'TotalCapacityBody')
  .mockImplementation((props) => mockTotalCapacityBody(props));
jest
  .spyOn(TestDependency4, 'BreakdownChart')
  .mockImplementation(() => <div data-test-id="mocked-breakdown-chart" />);

describe('tests for BreakdownCardBody', () => {
  const defaultProps: BreakdownBodyProps = {
    isLoading: false,
    hasLoadError: false,
    metricTotal: '100',
    top5MetricsStats: ['1', '2', '3', '4', '5'],
    capacityUsed: '50',
    capacityAvailable: '50',
    metricModel: PersistentVolumeClaimModel,
    // SAFETY: mockHumanize returns a partial HumanizeResult (only .string);
    // the full Humanize type requires value + unit too.
    humanize: mockHumanize as any,
  };

  it('should render BreakdownChartLoading when isLoading is true and hasLoadError is false', () => {
    const props = {
      ...defaultProps,
      isLoading: true,
      hasLoadError: false,
    };
    const { container } = render(<BreakdownCardBody {...props} />);

    expect(
      container.querySelector('[data-test-id="mocked-breakdown-chart-loading"]')
    ).toBeInTheDocument();
  });

  it('should render "Not available" when capacityUsed is empty', () => {
    const emptyDataProps = {
      ...defaultProps,
      capacityUsed: '',
      top5MetricsStats: ['non-empty', 'metrics', 'array'],
      hasLoadError: false,
    };
    const { getByText } = render(<BreakdownCardBody {...emptyDataProps} />);

    expect(getByText('Not available')).toBeInTheDocument();
  });

  it('should render "Not available" when top5MetricsStats is empty', () => {
    const emptyDataProps = {
      ...defaultProps,
      capacityUsed: '512',
      top5MetricsStats: [],
      hasLoadError: false,
    };
    const { getByText } = render(<BreakdownCardBody {...emptyDataProps} />);

    expect(getByText('Not available')).toBeInTheDocument();
  });

  it('should render "Not available" when hasLoadError is true', () => {
    const emptyDataProps = {
      ...defaultProps,
      capacityUsed: '',
      top5MetricsStats: [],
      hasLoadError: true,
    };
    const { getByText } = render(<BreakdownCardBody {...emptyDataProps} />);

    expect(getByText('Not available')).toBeInTheDocument();
  });

  it('should render "Not enough usage data" when capacityUsed is "0"', () => {
    const props = {
      ...defaultProps,
      capacityUsed: '0',
    };
    const { getByText } = render(<BreakdownCardBody {...props} />);

    expect(getByText('Not enough usage data')).toBeInTheDocument();
  });

  it('should render BreakdownChart when data is available', () => {
    const props = {
      ...defaultProps,
      isLoading: false,
      hasLoadError: false,
    };
    const { container } = render(<BreakdownCardBody {...props} />);

    expect(
      container.querySelector('[data-test-id="mocked-breakdown-chart"]')
    ).toBeInTheDocument();
  });

  it('should render TotalCapacityBody when data is available', () => {
    const props = {
      ...defaultProps,
      isLoading: false,
      hasLoadError: false,
    };
    const { container } = render(<BreakdownCardBody {...props} />);

    expect(
      container.querySelector('[data-test-id="mocked-total-capacity-body"]')
    ).toBeInTheDocument();
    expect(mockTotalCapacityBody).toHaveBeenCalled();
  });

  it('should render TotalCapacityBody when data is available and pass suffix when isPersistentInternal is not true', () => {
    const props = {
      ...defaultProps,
      isLoading: false,
      hasLoadError: false,
      isPersistentInternal: false,
    };
    const { container } = render(<BreakdownCardBody {...props} />);

    expect(
      container.querySelector('[data-test-id="mocked-total-capacity-body"]')
    ).toBeInTheDocument();
    expect(mockTotalCapacityBody).toHaveBeenLastCalledWith({
      capacity: '50 MB',
      className: 'capacity-breakdown-card__available-body text-secondary',
      suffix: 'available',
    });
  });

  it('should render TotalCapacityBody when data is available and not pass suffix when isPersistentInternal is true', () => {
    const props = {
      ...defaultProps,
      isLoading: false,
      hasLoadError: false,
      isPersistentInternal: true,
    };
    const { container } = render(<BreakdownCardBody {...props} />);

    expect(
      container.querySelector('[data-test-id="mocked-total-capacity-body"]')
    ).toBeInTheDocument();
    expect(mockTotalCapacityBody).toHaveBeenLastCalledWith({
      capacity: '50 MB',
      className: 'capacity-breakdown-card__available-body text-secondary',
    });
  });

  it('should render TotalCapacityBody when data is available by passing prefix and not passing suffix when isPersistentInternal is true', () => {
    const props = {
      ...defaultProps,
      isLoading: false,
      hasLoadError: false,
      isPersistentInternal: true,
    };
    const { container } = render(<BreakdownCardBody {...props} />);

    expect(
      container.querySelector('[data-test-id="mocked-total-capacity-body"]')
    ).toBeInTheDocument();
    expect(mockTotalCapacityBody).toHaveBeenNthCalledWith(
      mockTotalCapacityBody.mock.calls.length - 1,
      {
        capacity: '100 MB',
        prefix: 'Total requests: ',
        styleCapacityAsBold: true,
      }
    );
  });

  it('should render TotalCapacityBody when data is available by not passing prefix and passing suffix when isPersistentInternal is false', () => {
    const props = {
      ...defaultProps,
      isLoading: false,
      hasLoadError: false,
      isPersistentInternal: false,
    };
    const { container } = render(<BreakdownCardBody {...props} />);

    expect(
      container.querySelector('[data-test-id="mocked-total-capacity-body"]')
    ).toBeInTheDocument();
    expect(mockTotalCapacityBody).toHaveBeenNthCalledWith(
      mockTotalCapacityBody.mock.calls.length - 1,
      {
        capacity: '100 MB',
        styleCapacityAsBold: false,
        suffix: 'used',
      }
    );
  });
});
