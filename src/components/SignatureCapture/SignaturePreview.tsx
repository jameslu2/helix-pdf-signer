import React from 'react';
import { SignaturePreviewProps } from '../../types';

export const SignaturePreview: React.FC<SignaturePreviewProps> = ({
  dataUrl,
  onApply,
  onEdit,
}) => {
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
