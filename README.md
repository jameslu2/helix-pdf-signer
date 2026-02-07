# @helix/pdf-signer

Lightweight React library for PDF viewing and signature capture with CFR Part 11 compliance. Drop-in replacement for Nutrient SDK (formerly PSPDFKit).

## Features

- 📄 **PDF Viewing**: Built on PDF.js with zoom, navigation, and responsive design
- ✍️ **Signature Capture**: Canvas-based drawing and typed signatures
- 🔄 **PSPDFKit Compatible**: Outputs InstantJSON format compatible with existing backends
- ♿ **Accessible**: Keyboard navigation and screen reader support
- 📱 **Mobile Friendly**: Touch and mouse support, responsive layout
- 🔒 **CFR Part 11 Ready**: Captures metadata for compliance (timestamps, user agent, etc.)
- 🚀 **Self-Hosted**: Zero licensing costs, no external servers required

## Installation

```bash
npm install @helix/pdf-signer
# or
pnpm add @helix/pdf-signer
# or
yarn add @helix/pdf-signer
```

## Quick Start

```tsx
import { PDFSigner } from '@helix/pdf-signer';
import '@helix/pdf-signer/dist/styles.css';
import { useRef } from 'react';

function App() {
  const pdfRef = useRef(null);

  return (
    <PDFSigner
      ref={pdfRef}
      documentUrl="/path/to/document.pdf"
      onSignatureStatusChange={(allSigned, currentIndex) => {
        console.log('All signed:', allSigned);
        console.log('Current signature:', currentIndex);
      }}
      onSignatureApplied={(data) => {
        console.log('Signature applied:', data);
      }}
    />
  );
}
```

## API Reference

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `documentUrl` | `string` | ✅ | URL or path to PDF document |
| `onSignatureStatusChange` | `(allSigned: boolean, currentIndex: number) => void` | ❌ | Callback when signature status changes |
| `onSignatureApplied` | `(data: SignatureData) => void` | ❌ | Callback when a signature is applied |
| `onError` | `(error: Error) => void` | ❌ | Callback for errors |
| `className` | `string` | ❌ | Additional CSS class |
| `enableZoom` | `boolean` | ❌ | Enable zoom controls (default: `true`) |
| `enableNavigation` | `boolean` | ❌ | Enable page navigation (default: `true`) |
| `initialPage` | `number` | ❌ | Initial page number (default: `1`) |

### Ref Methods

```tsx
const pdfRef = useRef<PDFSignerRef>(null);

// Navigate to next unsigned signature field
pdfRef.current.nextSignature();

// Navigate to previous signature field
pdfRef.current.previousSignature();

// Update signature status
pdfRef.current.updateSignatureStatus();

// Get total number of signature fields
const count = pdfRef.current.getTotalSignatureCount();

// Get all signatures in PSPDFKit InstantJSON format
const instantJSON = pdfRef.current.getSignatures();

// Navigate to specific page
pdfRef.current.goToPage(2);
```

## Migration from Nutrient SDK

### Before (Nutrient SDK)

```tsx
import NutrientViewer from '@nutrient-sdk/viewer';

<PdfViewerComponent
  ref={pdfViewerRef}
  jwt={docEngToken}
  onSignatureStatusChange={(allSigned, currentIndex) => {...}}
/>
```

### After (@helix/pdf-signer)

```tsx
import { PDFSigner } from '@helix/pdf-signer';
import '@helix/pdf-signer/dist/styles.css';

<PDFSigner
  ref={pdfViewerRef}
  documentUrl={documentUrl}
  onSignatureStatusChange={(allSigned, currentIndex) => {...}}
/>
```

### Backend Changes

**Option A: Return Document URL (Recommended)**

```typescript
// enrollment-api/routes/documentRoutes.ts
POST /enrollment/document/generate
Response: {
  documentUrl: 'https://s3.amazonaws.com/bucket/document.pdf?signature=...',
  expiresAt: '2024-02-07T...',
}
```

**Option B: Backend Proxy (No Frontend Changes)**

```typescript
GET /enrollment/document/:requestId/pdf
→ Proxies PDF from S3 to frontend
```

## PSPDFKit InstantJSON Format

The library outputs signatures in PSPDFKit-compatible InstantJSON format:

```json
{
  "format": "https://pspdfkit.com/instant-json/v1",
  "annotations": [
    {
      "id": "sig-1-0-annotation",
      "type": "pspdfkit/image",
      "pageIndex": 0,
      "bbox": [100, 200, 300, 250],
      "v": 1,
      "createdAt": "2024-02-07T10:30:00.000Z",
      "updatedAt": "2024-02-07T10:30:00.000Z",
      "imageAttachmentId": "sig-1-0-attachment",
      "formFieldName": "signature-field-1"
    }
  ],
  "attachments": {
    "sig-1-0-attachment": {
      "contentType": "image/png",
      "data": "iVBORw0KGgoAAAANSUhEUgAA..."
    }
  }
}
```

## CFR Part 11 Compliance

The library captures metadata required for 21 CFR Part 11 compliance:

```typescript
{
  type: 'drawn' | 'typed',
  data: 'data:image/png;base64,...',
  timestamp: '2024-02-07T10:30:00.000Z',
  userAgent: 'Mozilla/5.0...'
}
```

Your backend should add:
- User ID (from authentication)
- IP address
- Audit trail entry
- Document hash

## Styling

Import the default styles:

```tsx
import '@helix/pdf-signer/dist/styles.css';
```

Or customize with CSS variables:

```css
.pdf-viewer {
  --primary-color: #2196F3;
  --secondary-color: #4CAF50;
  --border-color: #e0e0e0;
  --background-color: #f5f5f5;
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build library
pnpm build

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Lint
pnpm lint
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
