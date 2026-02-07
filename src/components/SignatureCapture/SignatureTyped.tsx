import React, { useState } from 'react';
import { SignatureTypedProps } from '../../types';
import { createCFRCompliantSignature } from '../../utils/signature-utils';

/**
 * SECURITY: Input validation constants for typed signatures
 *
 * Prevents:
 * - Buffer overflow attacks from extremely long names
 * - Script injection via special characters
 * - Control character injection (newlines, null bytes)
 * - Canvas rendering errors from invalid characters
 *
 * CWE-20: Improper Input Validation
 * CWE-79: Improper Neutralization of Input (XSS)
 */
const MAX_SIGNATURE_LENGTH = 100; // Reasonable max for human names
const ALLOWED_CHARS = /^[a-zA-Z\s\-'.]+$/; // Letters, spaces, hyphens, apostrophes, periods
const MIN_SIGNATURE_LENGTH = 2; // At least 2 characters

const SIGNATURE_FONTS = [
  { name: 'Cursive', value: 'cursive' },
  { name: 'Dancing Script', value: '"Dancing Script", cursive' },
  { name: 'Brush Script', value: '"Brush Script MT", cursive' },
];

/**
 * SECURITY: Sanitize and validate typed signature text
 *
 * Validation Rules:
 * - Length: 2-100 characters
 * - Allowed: Letters (a-z, A-Z), spaces, hyphens, apostrophes, periods
 * - Disallowed: Numbers, special chars, control chars, emojis
 *
 * @param text - Raw input from user
 * @returns Sanitized text
 * @throws Error with user-friendly message if invalid
 */
function sanitizeSignatureText(text: string): string {
  // Trim whitespace
  const trimmed = text.trim();

  // Check minimum length
  if (trimmed.length < MIN_SIGNATURE_LENGTH) {
    throw new Error('Signature must be at least 2 characters long');
  }

  // Enforce maximum length
  if (trimmed.length > MAX_SIGNATURE_LENGTH) {
    throw new Error(`Signature must be ${MAX_SIGNATURE_LENGTH} characters or less`);
  }

  // Validate allowed characters
  if (!ALLOWED_CHARS.test(trimmed)) {
    throw new Error('Signature can only contain letters, spaces, hyphens, apostrophes, and periods');
  }

  // Additional security: check for control characters
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    throw new Error('Signature contains invalid control characters');
  }

  return trimmed;
}

export const SignatureTyped: React.FC<SignatureTypedProps> = ({
  onComplete,
  onCancel,
  defaultName = '',
  signatureContext,
  defaultSignatureIntent = 'I approve this document',
  collectDeviceInfo = false,
}) => {
  const [text, setText] = useState(defaultName);
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0].value);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleApply = async () => {
    // SECURITY FIX: Validate and sanitize input before processing
    try {
      const sanitizedText = sanitizeSignatureText(text);
      setValidationError(null); // Clear any previous errors

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
        ctx.fillText(sanitizedText, canvas.width / 2, canvas.height / 2);

        const dataUrl = canvas.toDataURL('image/png');

        // CFR Part 11 COMPLIANCE: Create signature with required fields
        if (signatureContext) {
          try {
            const signatureData = await createCFRCompliantSignature(
              { type: 'typed', data: dataUrl },
              signatureContext,
              defaultSignatureIntent,
              collectDeviceInfo // GDPR: Only collect if explicitly opted-in
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
            // GDPR: Only collect userAgent if explicitly opted-in
            userAgent: collectDeviceInfo ? navigator.userAgent : undefined,
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
    } catch (error) {
      // Display validation error to user
      const errorMessage = error instanceof Error ? error.message : 'Invalid signature format';
      setValidationError(errorMessage);
      console.warn('[Input Validation] Typed signature validation failed:', errorMessage);
    }
  };

  // Clear validation error when user types
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  };

  return (
    <div className="signature-typed-container">
      <div className="signature-typed-input-wrapper">
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder="Type your signature"
          className="signature-typed-input"
          maxLength={MAX_SIGNATURE_LENGTH}
          autoFocus
          aria-invalid={validationError !== null}
          aria-describedby={validationError ? 'signature-error' : undefined}
        />
        {validationError && (
          <div
            id="signature-error"
            className="signature-validation-error"
            role="alert"
            style={{
              color: '#d32f2f',
              fontSize: '0.875rem',
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#ffebee',
              borderRadius: '4px',
              border: '1px solid #ffcdd2',
            }}
          >
            {validationError}
          </div>
        )}
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
