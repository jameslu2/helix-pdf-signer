# @helix/pdf-signer

[![GitHub](https://img.shields.io/badge/GitHub-helix--pdf--signer-blue?logo=github)](https://github.com/jameslu2/helix-pdf-signer)
[![Production Ready](https://img.shields.io/badge/status-production%20ready-success)](https://github.com/jameslu2/helix-pdf-signer/blob/main/PROJECT_STATUS.md)
[![Tests](https://img.shields.io/badge/tests-102%20passing-success)](https://github.com/jameslu2/helix-pdf-signer/tree/main/tests)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/jameslu2/helix-pdf-signer/blob/main/LICENSE)

Lightweight React library for PDF viewing and signature capture with CFR Part 11 compliance. Drop-in replacement for Nutrient SDK (formerly PSPDFKit).

**✅ Production Ready** | [Documentation](https://github.com/jameslu2/helix-pdf-signer/blob/main/PROJECT_STATUS.md) | [Security Review](https://github.com/jameslu2/helix-pdf-signer/blob/main/COMBINED_REVIEW.md) | [Font Configuration](https://github.com/jameslu2/helix-pdf-signer/blob/main/docs/FONT_CONFIGURATION.md)

## Why Choose This Library?

**Cost Savings**
- ✅ Zero licensing costs (vs Nutrient SDK)
- ✅ No external infrastructure (self-hosted)
- ✅ No per-user fees (unlimited use)
- ✅ No vendor lock-in (open source)

**Security Hardened**
- ✅ 10 critical security fixes
- ✅ OWASP Top 10 + CWE coverage
- ✅ Comprehensive input validation
- ✅ Memory leak prevention
- ✅ Error boundary with sanitized messages

**Production Ready**
- ✅ 102 tests passing (60+ unit, 42 E2E)
- ✅ CFR Part 11 compliant
- ✅ GDPR/CCPA compliant
- ✅ WCAG 2.1 AA accessible
- ✅ Multi-browser tested

**Developer Experience**
- ✅ TypeScript strict mode
- ✅ Drop-in Nutrient SDK replacement
- ✅ PSPDFKit-compatible output
- ✅ Comprehensive documentation
- ✅ Active development

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

  // CFR Part 11.50(a) - Printed name, date/time, meaning
  signerName: 'John Doe',
  signerIntent: 'I approve this document',

  // CFR Part 11.100 - User identification
  signerId: 'user-123',
  authMethod: 'okta_2fa',

  // CFR Part 11.70 - Signature linking
  signatureHash: 'a3b2c1...', // SHA-256
  documentHash: 'd4e5f6...',

  // Audit trail
  sessionId: 'session-xyz',
  ipAddress: '192.168.1.1', // Optional, opt-in
  signatureVersion: '1.0.0',
  deviceInfo: { ... } // Optional, GDPR-compliant (opt-in)
}
```

### Enhanced Security Features

✅ **Supply Chain Security**: Bundled PDF.js worker (no CDN dependencies)
✅ **SSRF Prevention**: URL validation with protocol/domain whitelist
✅ **XSS Prevention**: Data URL validation + input sanitization
✅ **Injection Prevention**: Character whitelisting for typed signatures
✅ **Memory Safety**: Proper resource cleanup
✅ **Type Safety**: No `any` types
✅ **Error Handling**: Sanitized error messages
✅ **Cryptographic IDs**: RFC 4122 UUID v4
✅ **GDPR/CCPA Compliant**: Privacy by default, opt-in device tracking

See [COMBINED_REVIEW.md](https://github.com/jameslu2/helix-pdf-signer/blob/main/COMBINED_REVIEW.md) for full security audit.

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

## Testing

The library has comprehensive test coverage:

- ✅ **60+ Unit Tests**: Memory leaks, URL validation, CFR compliance, crypto, XSS prevention
- ✅ **42 E2E Tests**: Signature workflows, security validation, accessibility (WCAG 2.1 AA)
- ✅ **Multi-Browser**: Chrome, Firefox, Safari, Edge, Mobile Chrome, Mobile Safari
- ✅ **Accessibility**: axe-core scans, keyboard navigation, screen reader support

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run E2E tests (all browsers)
pnpm test:e2e

# Run E2E tests (specific browser)
pnpm test:e2e:chromium
pnpm test:e2e:firefox
pnpm test:e2e:webkit

# Run E2E tests with UI
pnpm test:e2e:ui

# Run E2E tests in debug mode
pnpm test:e2e:debug
```

See [tests/e2e/README.md](https://github.com/jameslu2/helix-pdf-signer/blob/main/tests/e2e/README.md) for E2E testing guide.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build library
pnpm build

# Lint
pnpm lint

# Type check
pnpm typecheck
```

## Documentation

- 📊 [Project Status & Metrics](https://github.com/jameslu2/helix-pdf-signer/blob/main/PROJECT_STATUS.md) - Production readiness report
- 🔒 [Security Review](https://github.com/jameslu2/helix-pdf-signer/blob/main/COMBINED_REVIEW.md) - Security audit and fixes
- 🔤 [Font Configuration](https://github.com/jameslu2/helix-pdf-signer/blob/main/docs/FONT_CONFIGURATION.md) - Font setup guide
- 🧪 [E2E Testing Guide](https://github.com/jameslu2/helix-pdf-signer/blob/main/tests/e2e/README.md) - E2E testing documentation

## Contributing

Contributions are welcome! Please read the [security review](https://github.com/jameslu2/helix-pdf-signer/blob/main/COMBINED_REVIEW.md) first to understand the security requirements.

## License

MIT

## Support

- 🐛 [Report Issues](https://github.com/jameslu2/helix-pdf-signer/issues)
- 💬 [GitHub Discussions](https://github.com/jameslu2/helix-pdf-signer/discussions)
- 📖 [Documentation](https://github.com/jameslu2/helix-pdf-signer)

## Acknowledgments

Built with:
- [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla
- [react-pdf](https://github.com/wojtekmaj/react-pdf) by Wojciech Maj
- [signature_pad](https://github.com/szimek/signature_pad) by Szymon Nowak

---

**Made with ❤️ for the healthcare industry**
