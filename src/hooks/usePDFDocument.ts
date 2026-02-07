import { useState, useEffect } from 'react';
import { pdfjs, PDFDocumentProxy } from 'pdfjs-dist';

// SECURITY FIX: Bundle PDF.js worker locally instead of loading from CDN
// This prevents supply chain attacks via compromised CDN
// Using Vite's ?url import to get the bundled worker path
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker with local bundle
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export function usePDFDocument(documentUrl: string) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentUrl) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const loadDocument = async () => {
      try {
        const loadingTask = pdfjs.getDocument(documentUrl);
        const pdf = await loadingTask.promise;

        if (!cancelled) {
          setDocument(pdf);
          setNumPages(pdf.numPages);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      cancelled = true;
    };
  }, [documentUrl]);

  return { document, numPages, isLoading, error };
}
