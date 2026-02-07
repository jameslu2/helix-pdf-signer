import React, { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';
import { SignatureCanvasProps } from '../../types';

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onComplete,
  onCancel,
  width = 500,
  height = 200,
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

  const handleApply = () => {
    if (signaturePad && !signaturePad.isEmpty()) {
      const dataUrl = signaturePad.toDataURL('image/png');
      onComplete({
        type: 'drawn',
        data: dataUrl,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });
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
