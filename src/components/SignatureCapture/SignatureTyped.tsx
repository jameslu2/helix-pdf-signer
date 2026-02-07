import React, { useState } from 'react';
import { SignatureTypedProps } from '../../types';
import { createCFRCompliantSignature } from '../../utils/signature-utils';

const SIGNATURE_FONTS = [
  { name: 'Cursive', value: 'cursive' },
  { name: 'Dancing Script', value: '"Dancing Script", cursive' },
  { name: 'Brush Script', value: '"Brush Script MT", cursive' },
];

export const SignatureTyped: React.FC<SignatureTypedProps> = ({
  onComplete,
  onCancel,
  defaultName = '',
  signatureContext,
  defaultSignatureIntent = 'I approve this document',
}) => {
  const [text, setText] = useState(defaultName);
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0].value);

  const handleApply = async () => {
    if (text.trim()) {
      // Create a canvas to render the typed signature
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `48px ${selectedFont}`;
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const dataUrl = canvas.toDataURL('image/png');

        // CFR Part 11 COMPLIANCE: Create signature with required fields
        if (signatureContext) {
          try {
            const signatureData = await createCFRCompliantSignature(
              { type: 'typed', data: dataUrl },
              signatureContext,
              defaultSignatureIntent
            );
            onComplete(signatureData);
          } catch (error) {
            console.error('Failed to create CFR-compliant signature:', error);
            alert('Failed to create signature. Please ensure all required fields are provided.');
          }
        } else {
          // Fallback for non-CFR environments (development/testing)
          console.warn('[CFR Part 11] signatureContext not provided - using minimal signature data');
          onComplete({
            type: 'typed',
            data: dataUrl,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            // Required CFR fields with placeholder values
            signerName: 'Not Provided',
            signerId: 'not-provided',
            signerIntent: defaultSignatureIntent,
            authMethod: 'unknown',
            signatureHash: 'not-computed',
            documentHash: 'not-provided',
            sessionId: 'not-provided',
            signatureVersion: '1.0.0',
          });
        }
      }
    }
  };

  return (
    <div className="signature-typed-container">
      <div className="signature-typed-input-wrapper">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your signature"
          className="signature-typed-input"
          autoFocus
        />
      </div>

      <div className="signature-typed-font-selector">
        <label>Font Style:</label>
        {SIGNATURE_FONTS.map((font) => (
          <button
            key={font.value}
            onClick={() => setSelectedFont(font.value)}
            className={`signature-font-btn ${
              selectedFont === font.value ? 'selected' : ''
            }`}
            style={{ fontFamily: font.value }}
          >
            {font.name}
          </button>
        ))}
      </div>

      <div className="signature-typed-preview" style={{ fontFamily: selectedFont }}>
        {text || 'Preview'}
      </div>

      <div className="signature-typed-actions">
        <button onClick={onCancel} className="signature-btn signature-btn-secondary">
          Cancel
        </button>
        <button
          onClick={handleApply}
          disabled={!text.trim()}
          className="signature-btn signature-btn-primary"
        >
          Apply Signature
        </button>
      </div>
    </div>
  );
};
