export { PDFViewer as PDFSigner } from './components/PDFViewer/PDFViewer';
export { PDFErrorBoundary } from './components/PDFViewer/PDFErrorBoundary';
export { SignatureDialog } from './components/SignatureCapture/SignatureDialog';
export { SignatureCanvas } from './components/SignatureCapture/SignatureCanvas';
export { SignatureTyped } from './components/SignatureCapture/SignatureTyped';

export * from './types';
export * from './hooks/usePDFDocument';
export * from './hooks/useSignatureFields';
export * from './hooks/useSignatureCapture';
export * from './hooks/useSignatureStatus';
// Export PDF utilities including security validation
export {
  extractSignatureFields,
  getPageDimensions,
  convertBBoxToPSPDFKit,
  validateDocumentUrl,
  documentUrlConfig,
} from './utils/pdf-utils';

// Export signature utilities including security validation
export {
  createPSPDFKitAnnotation,
  createPSPDFKitInstantJSON,
  dataURLToBase64,
  generateSignatureId,
  validateImageDataUrl,
  sanitizeImageDataUrl,
} from './utils/signature-utils';
