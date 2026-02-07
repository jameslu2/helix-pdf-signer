import React, { Component, ReactNode, ErrorInfo } from 'react';

/**
 * Error Boundary for PDF Viewer Component
 *
 * Catches and handles React component errors gracefully to prevent:
 * - White screen of death (entire app crashes)
 * - Sensitive error details exposed in UI
 * - Stack traces leaking implementation details
 * - Poor user experience on errors
 *
 * Security Features:
 * - Sanitizes error messages before displaying to users
 * - Logs detailed errors to console for debugging (dev mode only)
 * - Provides user-friendly fallback UI
 * - Prevents error propagation that could crash parent components
 * - Reports errors to external monitoring (if onError provided)
 *
 * CWE-209: Generation of Error Message Containing Sensitive Information
 * CWE-754: Improper Check for Unusual or Exceptional Conditions
 *
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */

interface PDFErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface PDFErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class PDFErrorBoundary extends Component<
  PDFErrorBoundaryProps,
  PDFErrorBoundaryState
> {
  constructor(props: PDFErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<PDFErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // SECURITY: Log detailed error info to console (not shown to user)
    // In production, this should only be visible in browser dev tools
    console.error('[PDF Error Boundary] Component error caught:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      errorInfo,
    });

    // Store error info in state for debugging
    this.setState({
      errorInfo,
    });

    // Report error to external monitoring service
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (reportingError) {
        // Prevent error reporting from causing additional errors
        console.error('[PDF Error Boundary] Error reporting failed:', reportingError);
      }
    }
  }

  /**
   * SECURITY: Sanitize error message to avoid leaking sensitive information
   *
   * Removes:
   * - File paths (may contain usernames or system info)
   * - API endpoints (internal URLs)
   * - Stack traces (implementation details)
   * - Authentication tokens (if accidentally logged)
   */
  private sanitizeErrorMessage(error: Error | null): string {
    if (!error) {
      return 'An unknown error occurred';
    }

    const message = error.message || error.toString();

    // Generic fallback for common error types
    if (message.includes('Network') || message.includes('fetch')) {
      return 'Failed to load PDF document. Please check your connection and try again.';
    }

    if (message.includes('PDF') || message.includes('document')) {
      return 'Failed to load PDF document. The file may be corrupted or invalid.';
    }

    if (message.includes('signature')) {
      return 'Failed to process signature. Please try again.';
    }

    // Generic error message (don't expose internal details)
    return 'An error occurred while loading the PDF viewer. Please refresh the page and try again.';
  }

  private handleRetry = (): void => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      const sanitizedMessage = this.sanitizeErrorMessage(this.state.error);

      return (
        <div
          className="pdf-error-boundary"
          style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            maxWidth: '600px',
            margin: '2rem auto',
          }}
        >
          <div
            style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              color: '#d32f2f',
            }}
          >
            ⚠️
          </div>

          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#333',
            }}
          >
            PDF Viewer Error
          </h2>

          <p
            style={{
              fontSize: '1rem',
              color: '#666',
              marginBottom: '1.5rem',
              lineHeight: 1.5,
            }}
          >
            {sanitizedMessage}
          </p>

          <button
            onClick={this.handleRetry}
            style={{
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#1565c0';
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#1976d2';
            }}
          >
            Try Again
          </button>

          {/* Development mode: show error details */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details
              style={{
                marginTop: '2rem',
                textAlign: 'left',
                backgroundColor: '#f5f5f5',
                padding: '1rem',
                borderRadius: '4px',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#666',
                  marginBottom: '0.5rem',
                }}
              >
                Error Details (Development Only)
              </summary>
              <pre
                style={{
                  fontSize: '0.875rem',
                  color: '#d32f2f',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflow: 'auto',
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
