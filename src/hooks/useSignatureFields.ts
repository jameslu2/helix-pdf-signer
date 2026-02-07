import { useState, useEffect } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { SignatureField } from '../types';
import { extractSignatureFields } from '../utils/pdf-utils';

export function useSignatureFields(pdfDocument: PDFDocumentProxy | null) {
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!pdfDocument) {
      setSignatureFields([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const loadFields = async () => {
      try {
        const fields = await extractSignatureFields(pdfDocument);

        if (!cancelled) {
          setSignatureFields(fields);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadFields();

    return () => {
      cancelled = true;
    };
  }, [pdfDocument]);

  const updateField = (fieldId: string, updates: Partial<SignatureField>) => {
    setSignatureFields((prev) =>
      prev.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );
  };

  return {
    signatureFields,
    isLoading,
    error,
    updateField,
  };
}
