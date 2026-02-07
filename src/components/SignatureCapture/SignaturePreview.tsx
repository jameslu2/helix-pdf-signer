import React from 'react';
import { SignaturePreviewProps } from '../../types';
import { validateImageDataUrl } from '../../utils/signature-utils';

export const SignaturePreview: React.FC<SignaturePreviewProps> = ({
  dataUrl,
  onApply,
  onEdit,
}) => {
  // SECURITY FIX: Validate data URL before rendering
  // Prevents XSS via SVG data URLs and DoS via oversized images
  if (!validateImageDataUrl(dataUrl)) {
    return (
      <div className="signature-preview-container">
        <div className="signature-preview-error" style={{
          padding: '20px',
          textAlign: 'center',
          color: '#d32f2f',
          backgroundColor: '#ffebee',
          borderRadius: '4px',
        }}>
          <h3 style={{ marginBottom: '8px' }}>Invalid Signature Data</h3>
          <p style={{ marginBottom: '16px', fontSize: '14px' }}>
            The signature data format is invalid or exceeds size limits.
          </p>
          <button
            onClick={onEdit}
            className="signature-btn signature-btn-secondary"
            style={{ marginTop: '8px' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="signature-preview-container">
      <div className="signature-preview-header">
        <h3>Preview Signature</h3>
      </div>
      <div className="signature-preview-image-wrapper">
        <img src={dataUrl} alt="Signature preview" className="signature-preview-image" />
      </div>
      <div className="signature-preview-actions">
        <button onClick={onEdit} className="signature-btn signature-btn-secondary">
          Edit
        </button>
        <button onClick={onApply} className="signature-btn signature-btn-primary">
          Apply Signature
        </button>
      </div>
    </div>
  );
};
