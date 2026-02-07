import { useState, useEffect } from 'react';
import { pdfjs, PDFDocumentProxy } from 'pdfjs-dist';
import { validateDocumentUrl } from '../utils/pdf-utils';

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
    let loadedDocument: PDFDocumentProxy | null = null;

    setIsLoading(true);
    setError(null);

    const loadDocument = async () => {
      try {
        // SECURITY FIX: Validate document URL before loading
        // Prevents SSRF, file system access, and malicious protocols
        if (!validateDocumentUrl(documentUrl)) {
          throw new Error(
            'Invalid or unauthorized document URL. ' +
            'Only HTTPS, blob, and data URLs from whitelisted domains are allowed.'
          );
        }

        const loadingTask = pdfjs.getDocument(documentUrl);
        const pdf = await loadingTask.promise;

        if (!cancelled) {
          loadedDocument = pdf;
          setDocument(pdf);
          setNumPages(pdf.numPages);
          setIsLoading(false);
        } else {
          // SECURITY FIX: Clean up document if component unmounted during load
          pdf.destroy();
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

      // SECURITY FIX [CRIT-4]: Properly destroy PDF document to prevent memory leak
      // This is critical for:
      // - Memory management: Each PDF can use 10-50MB
      // - Security: Clears sensitive PDF data from memory
      // - Resource cleanup: Terminates worker threads
      // CWE-401: Missing Release of Memory after Effective Lifetime
      // CWE-772: Missing Release of Resource after Effective Lifetime
      if (loadedDocument) {
        loadedDocument.destroy();
        loadedDocument = null;
      }
    };
  }, [documentUrl]);

  return { document, numPages, isLoading, error };
}
