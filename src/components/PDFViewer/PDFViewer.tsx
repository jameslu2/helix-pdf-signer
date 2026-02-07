import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { Document } from 'react-pdf';
import { PDFSignerRef, PDFSignerProps, SignatureField } from '../../types';
import { usePDFDocument } from '../../hooks/usePDFDocument';
import { useSignatureFields } from '../../hooks/useSignatureFields';
import { useSignatureCapture } from '../../hooks/useSignatureCapture';
import { useSignatureStatus } from '../../hooks/useSignatureStatus';
import { createPSPDFKitInstantJSON } from '../../utils/signature-utils';
import { Toolbar } from './Toolbar';
import { PDFPage } from './PDFPage';
import { SignatureDialog } from '../SignatureCapture/SignatureDialog';

export const PDFViewer = forwardRef<PDFSignerRef, PDFSignerProps>((props, ref) => {
  const {
    documentUrl,
    onSignatureStatusChange,
    onSignatureApplied,
    onError,
    className = '',
    enableZoom = true,
    enableNavigation = true,
    initialPage = 1,
    signatureContext,
    defaultSignatureIntent,
  } = props;

  const [pageNumber, setPageNumber] = useState(initialPage);
  const [zoom, setZoom] = useState(1.0);
  const [pageDimensions, setPageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());

  const { document, numPages, isLoading, error } = usePDFDocument(documentUrl);
  const { signatureFields, updateField } = useSignatureFields(document);
  const {
    isDialogOpen,
    currentField,
    signatures,
    openDialog,
    closeDialog,
    applySignature,
    hasSignature,
  } = useSignatureCapture();

  const signedFieldIds = new Set(signatures.keys());
  const { currentIndex, allSigned, nextSignature, previousSignature } = useSignatureStatus(
    signatureFields,
    signedFieldIds
  );

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  useEffect(() => {
    onSignatureStatusChange?.(allSigned, currentIndex);
  }, [allSigned, currentIndex, onSignatureStatusChange]);

  const handleSignatureFieldClick = (field: SignatureField) => {
    if (!hasSignature(field.id)) {
      openDialog(field);
    }
  };

  const handleSignatureComplete = (data: any) => {
    if (currentField) {
      applySignature(currentField.id, data);
      updateField(currentField.id, {
        signedBy: 'user',
        signedAt: data.timestamp,
      });
      onSignatureApplied?.(data);
    }
  };

  const handleNextSignature = () => {
    const field = nextSignature();
    if (field) {
      const pageIndex = field.pageIndex + 1;
      setPageNumber(pageIndex);
      openDialog(field);
    }
  };

  const handlePreviousSignature = () => {
    const field = previousSignature();
    if (field) {
      const pageIndex = field.pageIndex + 1;
      setPageNumber(pageIndex);
    }
  };

  useImperativeHandle(ref, () => ({
    nextSignature: () => {
      handleNextSignature();
    },
    previousSignature: () => {
      handlePreviousSignature();
    },
    updateSignatureStatus: () => {
      onSignatureStatusChange?.(allSigned, currentIndex);
    },
    getTotalSignatureCount: () => {
      return signatureFields.length;
    },
    getSignatures: () => {
      // SECURITY FIX: Remove non-null assertion and properly handle missing fields
      // Filter out signatures for fields that no longer exist (defensive programming)
      const signatureMap = new Map(
        Array.from(signatures.entries())
          .map(([fieldId, data]) => {
            const field = signatureFields.find((f) => f.id === fieldId);

            // If field doesn't exist (should never happen, but be defensive)
            if (!field) {
              console.error(
                `[Security] Signature exists for unknown field: ${fieldId}. ` +
                'This may indicate data corruption or tampering.'
              );
              return null; // Will be filtered out below
            }

            const dimensions = pageDimensions.get(field.pageIndex + 1);
            return [
              fieldId,
              {
                data,
                field,
                pageHeight: dimensions?.height || 792, // Default to US Letter height
              },
            ];
          })
          .filter((entry): entry is [string, { data: any; field: SignatureField; pageHeight: number }] =>
            entry !== null
          )
      );
      return createPSPDFKitInstantJSON(signatureMap);
    },
    goToPage: (page: number) => {
      setPageNumber(Math.max(1, Math.min(page, numPages)));
    },
  }));

  if (isLoading) {
    return <div className="pdf-viewer-loading">Loading PDF...</div>;
  }

  if (error) {
    return <div className="pdf-viewer-error">Error loading PDF: {error.message}</div>;
  }

  return (
    <div className={`pdf-viewer ${className}`}>
      {enableNavigation && (
        <Toolbar
          currentPage={pageNumber}
          numPages={numPages}
          zoom={zoom}
          onZoomChange={enableZoom ? setZoom : () => {}}
          onPageChange={setPageNumber}
          onNextSignature={handleNextSignature}
          onPreviousSignature={handlePreviousSignature}
          currentSignatureIndex={currentIndex}
          totalSignatures={signatureFields.length}
        />
      )}

      <div className="pdf-viewer-content">
        <Document file={documentUrl}>
          <PDFPage
            pageNumber={pageNumber}
            scale={zoom}
            signatureFields={signatureFields}
            signedFieldIds={signedFieldIds}
            onSignatureFieldClick={handleSignatureFieldClick}
            onLoadSuccess={(page) => {
              const viewport = page.getViewport({ scale: 1 });
              setPageDimensions((prev) => {
                const next = new Map(prev);
                next.set(pageNumber, {
                  width: viewport.width,
                  height: viewport.height,
                });
                return next;
              });
            }}
          />
        </Document>
      </div>

      <SignatureDialog
        isOpen={isDialogOpen}
        field={currentField}
        onComplete={handleSignatureComplete}
        onCancel={closeDialog}
        signatureContext={signatureContext}
        defaultSignatureIntent={defaultSignatureIntent}
      />
    </div>
  );
});

PDFViewer.displayName = 'PDFViewer';
