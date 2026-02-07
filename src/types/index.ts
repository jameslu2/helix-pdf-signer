export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SignatureField {
  id: string;
  pageIndex: number;
  fieldName: string;
  boundingBox: BoundingBox;
  required: boolean;
  signedBy: string | null;
  signedAt: string | null;
}

export interface SignatureData {
  type: 'drawn' | 'typed';
  data: string; // Data URL for drawn, text for typed
  timestamp: string;
  userAgent?: string;
}

export interface PSPDFKitAnnotation {
  id: string;
  type: 'pspdfkit/ink' | 'pspdfkit/image' | 'pspdfkit/widget';
  pageIndex: number;
  bbox: [number, number, number, number];
  v: number;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
  lines?: Array<{
    intensities: number[];
    points: number[];
  }>;
  imageAttachmentId?: string;
  formFieldName?: string;
  blendMode?: string;
  opacity?: number;
  strokeColor?: { r: number; g: number; b: number };
  strokeWidth?: number;
}

export interface PSPDFKitInstantJSON {
  format: 'https://pspdfkit.com/instant-json/v1';
  annotations: PSPDFKitAnnotation[];
  attachments?: Record<string, {
    contentType: string;
    data: string; // Base64
  }>;
}

export interface PDFSignerRef {
  nextSignature: () => void;
  previousSignature: () => void;
  updateSignatureStatus: () => void;
  getTotalSignatureCount: () => number;
  getSignatures: () => PSPDFKitInstantJSON;
  goToPage: (pageNumber: number) => void;
}

export interface PDFSignerProps {
  documentUrl: string;
  onSignatureStatusChange?: (allSigned: boolean, currentIndex: number) => void;
  onSignatureApplied?: (data: SignatureData) => void;
  onError?: (error: Error) => void;
  className?: string;
  enableZoom?: boolean;
  enableNavigation?: boolean;
  initialPage?: number;
}

export interface SignatureDialogProps {
  isOpen: boolean;
  field: SignatureField | null;
  onComplete: (data: SignatureData) => void;
  onCancel: () => void;
}

export interface SignatureCanvasProps {
  onComplete: (data: SignatureData) => void;
  onCancel: () => void;
  width?: number;
  height?: number;
}

export interface SignatureTypedProps {
  onComplete: (data: SignatureData) => void;
  onCancel: () => void;
  defaultName?: string;
}

export interface SignaturePreviewProps {
  dataUrl: string;
  onApply: () => void;
  onEdit: () => void;
}

export interface ToolbarProps {
  currentPage: number;
  numPages: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onPageChange: (page: number) => void;
  onNextSignature?: () => void;
  onPreviousSignature?: () => void;
  currentSignatureIndex?: number;
  totalSignatures?: number;
}
