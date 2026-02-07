import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PDFSigner } from '../../src';

// Mock react-pdf
jest.mock('react-pdf', () => ({
  Document: ({ children }: any) => <div data-testid="pdf-document">{children}</div>,
  Page: () => <div data-testid="pdf-page">Page</div>,
  pdfjs: {
    GlobalWorkerOptions: {},
    version: '3.0.0',
  },
}));

// Mock pdfjs-dist
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn(() =>
        Promise.resolve({
          getAnnotations: jest.fn(() => Promise.resolve([])),
          getViewport: jest.fn(() => ({ width: 612, height: 792 })),
        })
      ),
    }),
  })),
  GlobalWorkerOptions: {},
  version: '3.0.0',
}));

describe('PDFSigner', () => {
  it('renders loading state initially', () => {
    render(<PDFSigner documentUrl="test.pdf" />);
    expect(screen.getByText('Loading PDF...')).toBeInTheDocument();
  });

  it('renders PDF document after loading', async () => {
    render(<PDFSigner documentUrl="test.pdf" />);

    await waitFor(() => {
      expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
    });
  });

  it('calls onSignatureStatusChange when signature status updates', async () => {
    const onSignatureStatusChange = jest.fn();

    render(
      <PDFSigner documentUrl="test.pdf" onSignatureStatusChange={onSignatureStatusChange} />
    );

    await waitFor(() => {
      expect(onSignatureStatusChange).toHaveBeenCalledWith(false, 0);
    });
  });
});
