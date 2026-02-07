import { useState, useCallback } from 'react';
import { SignatureData, SignatureField } from '../types';

export function useSignatureCapture() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentField, setCurrentField] = useState<SignatureField | null>(null);
  const [signatures, setSignatures] = useState<Map<string, SignatureData>>(new Map());

  const openDialog = useCallback((field: SignatureField) => {
    setCurrentField(field);
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setCurrentField(null);
  }, []);

  const applySignature = useCallback((fieldId: string, data: SignatureData) => {
    setSignatures((prev) => {
      const next = new Map(prev);
      next.set(fieldId, data);
      return next;
    });
    closeDialog();
  }, [closeDialog]);

  const clearSignature = useCallback((fieldId: string) => {
    setSignatures((prev) => {
      const next = new Map(prev);
      next.delete(fieldId);
      return next;
    });
  }, []);

  const getSignature = useCallback((fieldId: string): SignatureData | undefined => {
    return signatures.get(fieldId);
  }, [signatures]);

  const hasSignature = useCallback((fieldId: string): boolean => {
    return signatures.has(fieldId);
  }, [signatures]);

  return {
    isDialogOpen,
    currentField,
    signatures,
    openDialog,
    closeDialog,
    applySignature,
    clearSignature,
    getSignature,
    hasSignature,
  };
}
