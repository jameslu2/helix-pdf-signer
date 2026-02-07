import React from 'react';
import { SignatureField } from '../../types';

interface SignatureFieldOverlayProps {
  field: SignatureField;
  isSigned: boolean;
  onClick: () => void;
  scale: number;
  pageWidth: number;
  pageHeight: number;
}

export const SignatureFieldOverlay: React.FC<SignatureFieldOverlayProps> = ({
  field,
  isSigned,
  onClick,
  scale,
  pageWidth,
  pageHeight,
}) => {
  const { boundingBox } = field;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${(boundingBox.x / pageWidth) * 100}%`,
    top: `${(boundingBox.y / pageHeight) * 100}%`,
    width: `${(boundingBox.width / pageWidth) * 100}%`,
    height: `${(boundingBox.height / pageHeight) * 100}%`,
    border: isSigned ? '2px solid #4CAF50' : '2px dashed #2196F3',
    backgroundColor: isSigned ? 'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)',
    cursor: isSigned ? 'default' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: isSigned ? '#4CAF50' : '#2196F3',
    fontWeight: 'bold',
    pointerEvents: isSigned ? 'none' : 'auto',
  };

  return (
    <div
      className={`signature-field-overlay ${isSigned ? 'signed' : 'unsigned'}`}
      style={style}
      onClick={onClick}
      data-testid={`signature-field-${field.id}`}
      data-signed={isSigned}
      role="button"
      tabIndex={isSigned ? -1 : 0}
      aria-label={`${isSigned ? 'Signed' : 'Click to sign'}: ${field.fieldName}`}
      onKeyDown={(e) => {
        if (!isSigned && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {isSigned ? '✓ Signed' : 'Click to Sign'}
    </div>
  );
};
