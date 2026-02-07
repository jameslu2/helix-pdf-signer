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

/**
 * Signature data with CFR Part 11 compliance fields
 *
 * 21 CFR Part 11 Requirements:
 * - 11.50(a): Signed electronic records must contain:
 *   1. Printed name of the signer
 *   2. Date and time of signing
 *   3. Meaning of the signature (e.g., review, approval, responsibility)
 * - 11.70: Electronic signatures shall be linked to their respective records
 * - 11.100: Use of identification codes and passwords
 */
export interface SignatureData {
  // Basic signature information
  type: 'drawn' | 'typed';
  data: string; // Data URL for drawn signatures, text for typed
  timestamp: string; // ISO 8601 UTC timestamp
  userAgent?: string; // Browser information for audit trail

  // CFR Part 11.50(a) - REQUIRED: Signature Manifestations
  signerName: string; // Printed name of the individual signing
  signerIntent: string; // Meaning: "I approve", "I acknowledge", "I authorize", etc.

  // CFR Part 11.100 - REQUIRED: General Requirements
  signerId: string; // Unique user identifier from authentication system
  authMethod: string; // Authentication method used (e.g., "okta_2fa", "saml_sso")

  // CFR Part 11.70 - REQUIRED: Signature/Record Linking
  signatureHash: string; // SHA-256 hash of signature data for integrity
  documentHash: string; // SHA-256 hash of document at time of signing

  // Audit Trail & Non-Repudiation - RECOMMENDED
  sessionId: string; // Session identifier for audit correlation
  ipAddress?: string; // IP address (should be captured server-side)
  signatureVersion: string; // Library version for audit purposes

  // Optional device metadata
  deviceInfo?: {
    platform: string; // e.g., "MacOS", "Windows", "iOS", "Android"
    browser: string; // e.g., "Chrome 120", "Safari 17"
    isMobile: boolean;
    screenResolution?: string; // e.g., "1920x1080"
  };
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

  // CFR Part 11 Required Context - must be provided by consuming application
  signatureContext?: {
    signerName: string; // From authentication system
    signerId: string; // From authentication system
    sessionId: string; // From session management
    documentHash: string; // From backend
    authMethod: string; // Authentication method used
    ipAddress?: string; // Should be captured server-side
  };

  // Optional: Override default signature intent
  defaultSignatureIntent?: string; // Default: "I approve this document"
}

export interface SignatureDialogProps {
  isOpen: boolean;
  field: SignatureField | null;
  onComplete: (data: SignatureData) => void;
  onCancel: () => void;
  signatureContext?: PDFSignerProps['signatureContext'];
  defaultSignatureIntent?: string;
}

export interface SignatureCanvasProps {
  onComplete: (data: SignatureData) => void;
  onCancel: () => void;
  width?: number;
  height?: number;
  signatureContext?: PDFSignerProps['signatureContext'];
  defaultSignatureIntent?: string;
}

export interface SignatureTypedProps {
  onComplete: (data: SignatureData) => void;
  onCancel: () => void;
  defaultName?: string;
  signatureContext?: PDFSignerProps['signatureContext'];
  defaultSignatureIntent?: string;
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
