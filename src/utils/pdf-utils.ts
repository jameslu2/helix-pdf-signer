import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { SignatureField } from '../types';

// SECURITY: Allowed protocols for PDF loading
// Only HTTPS and blob URLs are permitted to prevent:
// - File system access (file://)
// - JavaScript injection (javascript:)
// - SSRF attacks (http:// to internal networks)
// - FTP access (ftp://)
const ALLOWED_PROTOCOLS = ['https:', 'blob:', 'data:'] as const;

// SECURITY: Configure allowed domains for your application
// For production, replace with your actual domain whitelist
// Examples:
// - 'your-s3-bucket.s3.amazonaws.com'
// - 'api.your-domain.com'
// - 'cdn.your-domain.com'
const ALLOWED_DOMAINS: string[] = [
  // Add your allowed domains here
  // Example: 's3.amazonaws.com',
  // For development/testing, you may want to allow localhost
  ...(process.env.NODE_ENV === 'development' ? ['localhost', '127.0.0.1'] : []),
];

/**
 * SECURITY FIX: Validates document URLs before loading
 *
 * Prevents:
 * - SSRF (Server-Side Request Forgery) attacks
 * - Local file system access (file://)
 * - JavaScript injection (javascript:)
 * - Access to internal networks
 * - Malicious protocol usage
 *
 * CWE-918: Server-Side Request Forgery (SSRF)
 * CWE-20: Improper Input Validation
 *
 * @param url - The document URL to validate
 * @returns true if URL is safe to load, false otherwise
 */
export function validateDocumentUrl(url: string): boolean {
  // Reject empty or non-string URLs
  if (!url || typeof url !== 'string') {
    console.error('[Security] Document URL validation failed: Empty or invalid URL');
    return false;
  }

  // Reject extremely long URLs (potential DoS)
  const MAX_URL_LENGTH = 2048;
  if (url.length > MAX_URL_LENGTH) {
    console.error('[Security] Document URL validation failed: URL exceeds maximum length');
    return false;
  }

  try {
    // Parse URL (will throw on invalid format)
    const parsed = new URL(url, window.location.origin);

    // Check protocol whitelist
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol as any)) {
      console.error(
        `[Security] Document URL validation failed: Protocol "${parsed.protocol}" not allowed. ` +
        `Allowed protocols: ${ALLOWED_PROTOCOLS.join(', ')}`
      );
      return false;
    }

    // For HTTPS URLs, validate domain whitelist
    if (parsed.protocol === 'https:') {
      // If no domains configured and not in development, reject for safety
      if (ALLOWED_DOMAINS.length === 0 && process.env.NODE_ENV !== 'development') {
        console.error(
          '[Security] Document URL validation failed: No allowed domains configured. ' +
          'Configure ALLOWED_DOMAINS in pdf-utils.ts'
        );
        return false;
      }

      // Check if hostname is in whitelist
      const isAllowed = ALLOWED_DOMAINS.length === 0 || ALLOWED_DOMAINS.some(domain => {
        // Exact match or subdomain match
        return parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`);
      });

      if (!isAllowed) {
        console.error(
          `[Security] Document URL validation failed: Domain "${parsed.hostname}" not in whitelist. ` +
          `Allowed domains: ${ALLOWED_DOMAINS.join(', ')}`
        );
        return false;
      }
    }

    // For blob URLs, only allow same-origin blobs
    if (parsed.protocol === 'blob:') {
      const blobOrigin = parsed.origin;
      const currentOrigin = window.location.origin;

      if (blobOrigin !== currentOrigin) {
        console.error(
          `[Security] Document URL validation failed: Blob URL from different origin. ` +
          `Expected: ${currentOrigin}, Got: ${blobOrigin}`
        );
        return false;
      }
    }

    // For data URLs, validate size and format
    if (parsed.protocol === 'data:') {
      // Only allow PDF data URLs
      if (!url.startsWith('data:application/pdf;')) {
        console.error('[Security] Document URL validation failed: Data URL must be application/pdf');
        return false;
      }

      // Limit data URL size (10MB max)
      const MAX_DATA_URL_SIZE = 10 * 1024 * 1024;
      if (url.length > MAX_DATA_URL_SIZE) {
        console.error('[Security] Document URL validation failed: Data URL exceeds 10MB limit');
        return false;
      }
    }

    // URL passed all security checks
    return true;

  } catch (error) {
    // URL parsing failed
    console.error('[Security] Document URL validation failed: Invalid URL format', error);
    return false;
  }
}

/**
 * Security configuration for document URLs
 * Export this so consuming applications can configure domains
 */
export const documentUrlConfig = {
  getAllowedDomains: () => [...ALLOWED_DOMAINS],
  addAllowedDomain: (domain: string) => {
    if (!ALLOWED_DOMAINS.includes(domain)) {
      ALLOWED_DOMAINS.push(domain);
    }
  },
  removeAllowedDomain: (domain: string) => {
    const index = ALLOWED_DOMAINS.indexOf(domain);
    if (index > -1) {
      ALLOWED_DOMAINS.splice(index, 1);
    }
  },
};

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
