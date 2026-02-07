import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { SignatureField } from '../types';

export async function extractSignatureFields(
  pdfDocument: PDFDocumentProxy
): Promise<SignatureField[]> {
  const allFields: SignatureField[] = [];

  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const annotations = await page.getAnnotations();

    const signatureFields = annotations.filter(
      (ann: any) => ann.subtype === 'Widget' && ann.fieldType === 'Sig'
    );

    signatureFields.forEach((ann: any, idx: number) => {
      allFields.push({
        id: `sig-${i}-${idx}`,
        pageIndex: i - 1,
        fieldName: ann.fieldName || `signature-${i}-${idx}`,
        boundingBox: {
          x: ann.rect[0],
          y: ann.rect[1],
          width: ann.rect[2] - ann.rect[0],
          height: ann.rect[3] - ann.rect[1],
        },
        required: ann.required ?? true,
        signedBy: null,
        signedAt: null,
      });
    });
  }

  return allFields;
}

export function getPageDimensions(page: PDFPageProxy) {
  const viewport = page.getViewport({ scale: 1 });
  return {
    width: viewport.width,
    height: viewport.height,
  };
}

export function convertBBoxToPSPDFKit(
  boundingBox: { x: number; y: number; width: number; height: number },
  pageHeight: number
): [number, number, number, number] {
  // PSPDFKit uses bottom-left origin, PDF.js uses top-left
  const pdfY = pageHeight - boundingBox.y - boundingBox.height;
  return [
    boundingBox.x,
    pdfY,
    boundingBox.x + boundingBox.width,
    pdfY + boundingBox.height,
  ];
}
