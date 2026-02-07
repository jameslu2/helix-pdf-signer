import { useEffect, useState, useCallback } from 'react';
import { SignatureField } from '../types';

export function useSignatureStatus(
  signatureFields: SignatureField[],
  signedFieldIds: Set<string>
) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allSigned, setAllSigned] = useState(false);

  useEffect(() => {
    const signedCount = Array.from(signedFieldIds).length;
    const requiredCount = signatureFields.filter((f) => f.required).length;
    setAllSigned(signedCount >= requiredCount && requiredCount > 0);
  }, [signatureFields, signedFieldIds]);

  const nextSignature = useCallback(() => {
    const unsignedFields = signatureFields.filter(
      (field) => !signedFieldIds.has(field.id)
    );

    if (unsignedFields.length > 0) {
      const nextField = unsignedFields[0];
      const nextIndex = signatureFields.findIndex((f) => f.id === nextField.id);
      setCurrentIndex(nextIndex);
      return nextField;
    }

    return null;
  }, [signatureFields, signedFieldIds]);

  const previousSignature = useCallback(() => {
    const signedFields = signatureFields.filter((field) =>
      signedFieldIds.has(field.id)
    );

    if (signedFields.length > 0) {
      const prevField = signedFields[signedFields.length - 1];
      const prevIndex = signatureFields.findIndex((f) => f.id === prevField.id);
      setCurrentIndex(prevIndex);
      return prevField;
    }

    return null;
  }, [signatureFields, signedFieldIds]);

  return {
    currentIndex,
    allSigned,
    nextSignature,
    previousSignature,
  };
}
