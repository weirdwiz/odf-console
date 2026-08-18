import * as React from 'react';
import { NamespaceStoreKind } from '@odf/core/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { S3EndPointType } from '../mcg-endpoints/s3-endpoint-type';
import NamespaceStoreForm from './namespace-store-form';

const mockOnCancel = jest.fn();
const SafetyBox: React.FC<React.PropsWithChildren> = ({ children }) => children;
const Endpoint: typeof S3EndPointType = () => null;
const props = {
  redirectHandler: () => undefined,
  namespace: 'test-ns',
  onCancel: mockOnCancel,
  SafetyBoxComponent: SafetyBox,
  EndpointComponent: Endpoint,
  namespaceStoreListHook: (): [
    NamespaceStoreKind[],
    boolean,
    undefined,
  ] => [
    [{ metadata: { name: 'existing-ns-name' } }],
    true,
    undefined,
  ],
};

describe('NamespaceStoreForm', () => {
  it('renders the form', () => {
    render(<NamespaceStoreForm {...props} />);

    const nameInput = screen.getByPlaceholderText('my-namespacestore');
    expect(nameInput).toBeInTheDocument();
  });

  it('clicks on Cancel button', async () => {
    const user = userEvent.setup();
    render(<NamespaceStoreForm {...props} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('clicks on Create button', async () => {
    const user = userEvent.setup();
    const { container } = render(<NamespaceStoreForm {...props} />);

    const mockOnSubmit = jest.fn();
    container.getElementsByClassName('nb-endpoints-form')[0].onsubmit =
      mockOnSubmit;
    await user.click(screen.getByRole('button', { name: /create/i }));
    expect(mockOnSubmit).toHaveBeenCalled();
  });
});
