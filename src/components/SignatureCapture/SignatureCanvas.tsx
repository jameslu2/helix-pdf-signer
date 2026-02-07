import React, { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';
import { SignatureCanvasProps } from '../../types';
import { createCFRCompliantSignature } from '../../utils/signature-utils';

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onComplete,
  onCancel,
  width = 500,
  height = 200,
  signatureContext,
  defaultSignatureIntent = 'I approve this document',
  collectDeviceInfo = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (canvasRef.current) {
      const pad = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 0.5,
        maxWidth: 2.5,
      });

      pad.addEventListener('endStroke', () => {
        setIsEmpty(pad.isEmpty());
      });

      setSignaturePad(pad);

      return () => {
        pad.off();
      };
    }
  }, []);

  const handleClear = () => {
    signaturePad?.clear();
    setIsEmpty(true);
  };

  const handleApply = async () => {
    if (signaturePad && !signaturePad.isEmpty()) {
      const dataUrl = signaturePad.toDataURL('image/png');

      // CFR Part 11 COMPLIANCE: Create signature with required fields
      if (signatureContext) {
        try {
          const signatureData = await createCFRCompliantSignature(
            { type: 'drawn', data: dataUrl },
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
          type: 'drawn',
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
  };

  return (
    <div className="signature-canvas-container">
      <div className="signature-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="signature-canvas"
        />
      </div>
      <div className="signature-canvas-actions">
        <button
          onClick={handleClear}
          disabled={isEmpty}
          className="signature-btn signature-btn-secondary"
        >
          Clear
        </button>
        <button onClick={onCancel} className="signature-btn signature-btn-secondary">
          Cancel
        </button>
        <button
          onClick={handleApply}
          disabled={isEmpty}
          className="signature-btn signature-btn-primary"
        >
          Apply Signature
        </button>
      </div>
    </div>
  );
};
