import React from 'react';
import { Page } from 'react-pdf';
import { SignatureField } from '../../types';
import { SignatureFieldOverlay } from './SignatureFieldOverlay';

interface PDFPageProps {
  pageNumber: number;
  scale: number;
  signatureFields: SignatureField[];
  signedFieldIds: Set<string>;
  onSignatureFieldClick: (field: SignatureField) => void;
  onLoadSuccess?: (page: any) => void;
}

export const PDFPage: React.FC<PDFPageProps> = ({
  pageNumber,
  scale,
  signatureFields,
  signedFieldIds,
  onSignatureFieldClick,
  onLoadSuccess,
}) => {
  const [pageDimensions, setPageDimensions] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

  const handlePageLoad = (page: any) => {
    const viewport = page.getViewport({ scale: 1 });
    setPageDimensions({
      width: viewport.width,
      height: viewport.height,
    });
    onLoadSuccess?.(page);
  };

  const fieldsOnPage = signatureFields.filter(
    (field) => field.pageIndex === pageNumber - 1
  );

  return (
    <div className="pdf-page-container">
      <div className="pdf-page-wrapper">
        <Page
          pageNumber={pageNumber}
          scale={scale}
          renderAnnotationLayer={false}
          renderTextLayer={false}
          onLoadSuccess={handlePageLoad}
        />
        {pageDimensions &&
          fieldsOnPage.map((field) => (
            <SignatureFieldOverlay
              key={field.id}
              field={field}
              isSigned={signedFieldIds.has(field.id)}
              onClick={() => onSignatureFieldClick(field)}
              scale={scale}
              pageWidth={pageDimensions.width}
              pageHeight={pageDimensions.height}
            />
          ))}
      </div>
    </div>
  );
};
