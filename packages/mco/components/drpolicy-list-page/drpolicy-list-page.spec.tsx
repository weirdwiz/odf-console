import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DRPolicyListPage,
  drPolicyListDependencies,
} from './drpolicy-list-page';

let testCase = 1;
jest.spyOn(drPolicyListDependencies, 'useListPageFilter').mockImplementation(
  jest.fn(() => {
    if ([1, 2, 3].includes(testCase)) {
      return [[], [], jest.fn()];
    }
  })
);
jest.spyOn(drPolicyListDependencies, 'useK8sWatchResource').mockImplementation(
  jest.fn(() => {
    if (testCase === 1) {
      return [[], true, ''];
    } else if (testCase === 2) {
      return [
        [],
        true,
        {
          response: {
            status: 404,
          },
        },
      ];
    } else if (testCase === 3) {
      return [[], false, ''];
    }
  })
);
jest
  .spyOn(drPolicyListDependencies, 'useProtectedApplicationsWatch')
  .mockImplementation(
  jest.fn(() => {
    if ([1, 2, 3].includes(testCase)) {
      return [[], true, ''];
    }
  })
);
jest
  .spyOn(drPolicyListDependencies, 'useAccessReview')
  .mockImplementation(jest.fn(() => [true, false]));
jest
  .spyOn(drPolicyListDependencies, 'useNavigate')
  .mockImplementation(() => jest.fn());
jest
  .spyOn(drPolicyListDependencies, 'useLocation')
  .mockImplementation(() => ({ pathname: '/' }));

describe('Test drpolicy list page', () => {
  test('Empty page success test', async () => {
    render(<DRPolicyListPage />);
    expect(
      screen.getByText('No disaster recovery policies yet')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Empty Page')).toBeEnabled();
  });

  test('Empty page un authorized test', async () => {
    const user = userEvent.setup();
    testCase = 2;
    render(<DRPolicyListPage />);
    expect(
      screen.getByText('No disaster recovery policies yet')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Empty Page')).toBeEnabled();
    // Tooltip content check
    await user.hover(screen.getByLabelText('Empty Page'));
    expect(
      await screen.findByText(
        'You are not authorized to complete this action. See your cluster administrator for role-based access control information.'
      )
    ).toBeInTheDocument();
  });

  test('Empty page loading test', async () => {
    testCase = 3;
    render(<DRPolicyListPage />);
    expect(screen.getByLabelText('Loading empty page')).toBeInTheDocument();
  });
});
