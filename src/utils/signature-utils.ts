import { PSPDFKitAnnotation, PSPDFKitInstantJSON, SignatureData, SignatureField } from '../types';

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

export function generateSignatureId(): string {
  return `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
