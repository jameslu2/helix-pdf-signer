import React, { useState } from 'react';
import { SignatureDialogProps, SignatureData } from '../../types';
import { SignatureCanvas } from './SignatureCanvas';
import { SignatureTyped } from './SignatureTyped';
import { SignaturePreview } from './SignaturePreview';

export const SignatureDialog: React.FC<SignatureDialogProps> = ({
  isOpen,
  field,
  onComplete,
  onCancel,
}) => {
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [preview, setPreview] = useState<SignatureData | null>(null);

  if (!isOpen || !field) return null;

  const handleComplete = (data: SignatureData) => {
    setPreview(data);
  };

  const handleApply = () => {
    if (preview) {
      onComplete(preview);
      setPreview(null);
      setMode('draw');
    }
  };

  const handleEdit = () => {
    setPreview(null);
  };

  const handleCancel = () => {
    setPreview(null);
    setMode('draw');
    onCancel();
  };

  return (
    <div className="signature-dialog-overlay" onClick={handleCancel}>
      <div className="signature-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="signature-dialog-header">
          <h2>Sign Here</h2>
          <button
            onClick={handleCancel}
            className="signature-dialog-close"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {!preview && (
          <>
            <div className="signature-dialog-tabs">
              <button
                onClick={() => setMode('draw')}
                className={`signature-tab ${mode === 'draw' ? 'active' : ''}`}
              >
                Draw
              </button>
              <button
                onClick={() => setMode('type')}
                className={`signature-tab ${mode === 'type' ? 'active' : ''}`}
              >
                Type
              </button>
            </div>

            <div className="signature-dialog-content">
              {mode === 'draw' && (
                <SignatureCanvas onComplete={handleComplete} onCancel={handleCancel} />
              )}
              {mode === 'type' && (
                <SignatureTyped onComplete={handleComplete} onCancel={handleCancel} />
              )}
            </div>
          </>
        )}

        {preview && (
          <div className="signature-dialog-content">
            <SignaturePreview
              dataUrl={preview.data}
              onApply={handleApply}
              onEdit={handleEdit}
            />
          </div>
        )}
      </div>
    </div>
  );
};
