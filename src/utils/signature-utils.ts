import { PSPDFKitAnnotation, PSPDFKitInstantJSON, SignatureData, SignatureField } from '../types';

// SECURITY: Allowed image types for signature data URLs
// Only raster formats to prevent SVG-based XSS
const ALLOWED_IMAGE_TYPES = ['png', 'jpeg', 'jpg', 'gif', 'webp'] as const;

// SECURITY: Maximum data URL size (5MB)
// Prevents memory exhaustion DoS attacks
const MAX_DATA_URL_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * SECURITY FIX: Validates image data URLs before rendering
 *
 * Prevents:
 * - SVG-based XSS attacks (data:image/svg+xml with JavaScript)
 * - Memory exhaustion DoS (extremely large data URLs)
 * - Malformed data URL parsing bugs
 * - Non-image content injection
 *
 * CWE-79: Improper Neutralization of Input During Web Page Generation (XSS)
 * CWE-20: Improper Input Validation
 *
 * @param dataUrl - The data URL to validate
 * @returns true if data URL is safe to render, false otherwise
 */
export function validateImageDataUrl(dataUrl: string): boolean {
  // Reject empty or non-string data URLs
  if (!dataUrl || typeof dataUrl !== 'string') {
    console.error('[Security] Image data URL validation failed: Empty or invalid data URL');
    return false;
  }

  // Check size to prevent DoS via memory exhaustion
  if (dataUrl.length > MAX_DATA_URL_SIZE) {
    console.error(
      `[Security] Image data URL validation failed: Exceeds maximum size ` +
      `(${dataUrl.length} bytes > ${MAX_DATA_URL_SIZE} bytes)`
    );
    return false;
  }

  // Validate data URL format with strict regex
  // Format: data:image/<type>;base64,<base64-data>
  // Only allows base64 encoding (not percent encoding which could hide attacks)
  const DATA_URL_REGEX = new RegExp(
    `^data:image/(${ALLOWED_IMAGE_TYPES.join('|')});base64,[A-Za-z0-9+/]+=*$`
  );

  if (!DATA_URL_REGEX.test(dataUrl)) {
    console.error(
      '[Security] Image data URL validation failed: Invalid format or unsupported type. ' +
      `Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    );
    return false;
  }

  // Extract and validate base64 portion
  const base64Match = dataUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
  if (!base64Match) {
    console.error('[Security] Image data URL validation failed: Cannot extract base64 data');
    return false;
  }

  const base64Data = base64Match[1];

  // Validate base64 length is reasonable
  // Base64 encodes 3 bytes as 4 characters, so actual size is ~75% of base64 length
  const estimatedByteSize = (base64Data.length * 3) / 4;
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB for actual image data

  if (estimatedByteSize > MAX_IMAGE_SIZE) {
    console.error(
      `[Security] Image data URL validation failed: Image size too large ` +
      `(~${Math.round(estimatedByteSize / 1024)}KB > ${MAX_IMAGE_SIZE / 1024}KB)`
    );
    return false;
  }

  // Additional validation: check for null bytes or suspicious patterns
  if (base64Data.includes('\0') || base64Data.includes('\x00')) {
    console.error('[Security] Image data URL validation failed: Contains null bytes');
    return false;
  }

  // Data URL passed all security checks
  return true;
}

/**
 * Validates and sanitizes a data URL before use
 * Returns null if validation fails
 */
export function sanitizeImageDataUrl(dataUrl: string): string | null {
  return validateImageDataUrl(dataUrl) ? dataUrl : null;
}

export function createPSPDFKitAnnotation(
  signatureData: SignatureData,
  field: SignatureField,
  pageHeight: number
): PSPDFKitAnnotation {
  const timestamp = new Date().toISOString();
  const bbox = convertBBoxToPSPDFKit(field.boundingBox, pageHeight);

  if (signatureData.type === 'drawn') {
    // For drawn signatures, create an image annotation with attachment
    return {
      id: `${field.id}-annotation`,
      type: 'pspdfkit/image',
      pageIndex: field.pageIndex,
      bbox,
      v: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      imageAttachmentId: `${field.id}-attachment`,
      formFieldName: field.fieldName,
      blendMode: 'normal',
      opacity: 1,
    };
  } else {
    // For typed signatures, create an ink annotation with text-like appearance
    return {
      id: `${field.id}-annotation`,
      type: 'pspdfkit/ink',
      pageIndex: field.pageIndex,
      bbox,
      v: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      formFieldName: field.fieldName,
      strokeColor: { r: 0, g: 0, b: 0 },
      strokeWidth: 2,
      lines: convertTextToInkLines(signatureData.data, field.boundingBox),
    };
  }
}

function convertBBoxToPSPDFKit(
  boundingBox: { x: number; y: number; width: number; height: number },
  pageHeight: number
): [number, number, number, number] {
  const pdfY = pageHeight - boundingBox.y - boundingBox.height;
  return [
    boundingBox.x,
    pdfY,
    boundingBox.x + boundingBox.width,
    pdfY + boundingBox.height,
  ];
}

function convertTextToInkLines(
  text: string,
  boundingBox: { x: number; y: number; width: number; height: number }
): Array<{ intensities: number[]; points: number[] }> {
  // Simplified: create a single line representing the signature
  // In a real implementation, you'd convert the text to actual path points
  const centerY = boundingBox.height / 2;
  return [
    {
      intensities: [1.0, 1.0],
      points: [
        10, centerY,
        boundingBox.width - 10, centerY,
      ],
    },
  ];
}

export function createPSPDFKitInstantJSON(
  signatures: Map<string, { data: SignatureData; field: SignatureField; pageHeight: number }>
): PSPDFKitInstantJSON {
  const annotations: PSPDFKitAnnotation[] = [];
  const attachments: Record<string, { contentType: string; data: string }> = {};

  signatures.forEach(({ data, field, pageHeight }) => {
    const annotation = createPSPDFKitAnnotation(data, field, pageHeight);
    annotations.push(annotation);

    // Add attachment for drawn signatures
    if (data.type === 'drawn' && annotation.imageAttachmentId) {
      const base64Data = data.data.split(',')[1]; // Remove data:image/png;base64, prefix
      attachments[annotation.imageAttachmentId] = {
        contentType: 'image/png',
        data: base64Data,
      };
    }
  });

  return {
    format: 'https://pspdfkit.com/instant-json/v1',
    annotations,
    ...(Object.keys(attachments).length > 0 && { attachments }),
  };
}

export function dataURLToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1];
}

/**
 * SECURITY FIX: Generate cryptographically secure signature ID
 *
 * Prevents:
 * - Predictable signature IDs that could be guessed by attackers
 * - Signature ID collisions in high-traffic scenarios
 * - Replay attacks using predicted IDs
 *
 * Uses Web Crypto API's crypto.randomUUID() for:
 * - Cryptographically secure random number generation (CSPRNG)
 * - RFC 4122 UUID v4 format (128-bit random value)
 * - No possibility of collisions in practical scenarios
 *
 * CWE-330: Use of Insufficiently Random Values
 * CWE-338: Use of Cryptographically Weak Pseudo-Random Number Generator
 *
 * @returns Unique signature ID in format: sig-{timestamp}-{uuid}
 */
export function generateSignatureId(): string {
  // Use Web Crypto API for cryptographically secure random IDs
  // crypto.randomUUID() generates RFC 4122 v4 UUID (128-bit random)
  return `sig-${Date.now()}-${crypto.randomUUID()}`;
}

/**
 * Generates a SHA-256 hash of signature data for CFR Part 11 compliance
 * This ensures signature integrity and non-repudiation
 *
 * @param data - Signature data to hash (excluding the hash field itself)
 * @returns Promise resolving to hex-encoded SHA-256 hash
 */
export async function generateSignatureHash(
  data: Omit<import('../types').SignatureData, 'signatureHash'>
): Promise<string> {
  // Create deterministic string representation
  const hashInput = JSON.stringify({
    type: data.type,
    data: data.data,
    timestamp: data.timestamp,
    signerName: data.signerName,
    signerId: data.signerId,
    signerIntent: data.signerIntent,
    documentHash: data.documentHash,
  });

  // Use Web Crypto API for SHA-256
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(hashInput);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Helper to create CFR Part 11 compliant signature data
 * Validates required fields and generates hashes
 */
export async function createCFRCompliantSignature(
  baseData: {
    type: 'drawn' | 'typed';
    data: string;
  },
  context: {
    signerName: string;
    signerId: string;
    sessionId: string;
    documentHash: string;
    authMethod: string;
    ipAddress?: string;
  },
  signatureIntent: string = 'I approve this document'
): Promise<import('../types').SignatureData> {
  // Validate required fields
  if (!context.signerName) throw new Error('signerName is required for CFR Part 11 compliance');
  if (!context.signerId) throw new Error('signerId is required for CFR Part 11 compliance');
  if (!context.documentHash) throw new Error('documentHash is required for CFR Part 11 compliance');
  if (!signatureIntent) throw new Error('signatureIntent is required for CFR Part 11 compliance');

  // Create base signature data
  const timestamp = new Date().toISOString();
  const partialData = {
    type: baseData.type,
    data: baseData.data,
    timestamp,
    userAgent: navigator.userAgent,
    signerName: context.signerName,
    signerId: context.signerId,
    signerIntent: signatureIntent,
    authMethod: context.authMethod,
    documentHash: context.documentHash,
    sessionId: context.sessionId,
    ipAddress: context.ipAddress,
    signatureVersion: '1.0.0', // Library version
    deviceInfo: {
      platform: navigator.platform,
      browser: navigator.userAgent,
      isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
    },
    signatureHash: '', // Will be computed
  };

  // Generate signature hash
  const hash = await generateSignatureHash(partialData);

  // Return complete signature data
  return {
    ...partialData,
    signatureHash: hash,
  };
}
