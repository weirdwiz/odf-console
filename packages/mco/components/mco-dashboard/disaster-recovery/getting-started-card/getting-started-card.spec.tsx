import * as React from 'react';
import { gettingStartedDRDocs } from '@odf/mco/constants';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GettingStartedCard,
  gettingStartedCardDependencies,
} from './getting-started-card';
import { gettingStartedHelperDependencies } from './helper';

const setIsOpen = jest.fn(() => null);
const navigate = jest.fn(() => null);
jest
  .spyOn(gettingStartedCardDependencies, 'useFlag')
  .mockImplementation(jest.fn(() => true));
jest
  .spyOn(gettingStartedCardDependencies, 'useUserSettings')
  .mockImplementation(jest.fn(() => [true, setIsOpen]));
jest.replaceProperty(
  gettingStartedCardDependencies,
  'mcoDocVersion',
  '1.2'
);
jest
  .spyOn(gettingStartedHelperDependencies, 'useK8sWatchResource')
  .mockImplementation(jest.fn(() => [['policy1', 'policy2'], true, '']));
jest
  .spyOn(gettingStartedHelperDependencies, 'useNavigate')
  .mockImplementation(() => navigate);
const mockEnrollApplicationButton = jest
  .spyOn(gettingStartedHelperDependencies, 'EnrollApplicationButton')
  .mockImplementation(jest.fn(() => null));

describe('Test getting started card (GettingStartedCard)', () => {
  afterEach(() => jest.clearAllMocks());

  it('Renders card with all the steps and their details', async () => {
    const user = userEvent.setup();
    render(<GettingStartedCard />);

    // header -- title
    expect(screen.getByText('Create policy')).toBeInTheDocument();
    expect(screen.getByText('Enroll applications')).toBeInTheDocument();
    expect(
      screen.getByText('Monitoring resources (optional)')
    ).toBeInTheDocument();

    // body -- doc link
    expect(screen.getByText('See documentation')).toHaveAttribute(
      'href',
      gettingStartedDRDocs('1.2').CREATE_POLICY
    );
    expect(screen.getByText('Steps to enable monitoring')).toHaveAttribute(
      'href',
      gettingStartedDRDocs('1.2').ENABLE_MONITORING
    );

    // footer -- button
    const policyButton = screen.getByRole('button', {
      name: 'Create a disaster recovery policy',
    });
    expect(policyButton).toBeInTheDocument();
    await user.click(policyButton);
    expect(navigate).toHaveBeenCalledTimes(1);

    const viewPolicyButton = screen.getByRole('button', {
      name: 'View policies',
    });
    expect(viewPolicyButton).toBeInTheDocument();
    await user.click(viewPolicyButton);
    expect(navigate).toHaveBeenCalledTimes(2); // called once before via "policyButton" click

    expect(mockEnrollApplicationButton).toHaveBeenCalledTimes(1);
  });
});
