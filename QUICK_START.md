# Quick Start Guide

Get up and running with @helix/pdf-signer in 5 minutes.

## Installation

```bash
npm install @helix/pdf-signer
# or
pnpm add @helix/pdf-signer
# or
yarn add @helix/pdf-signer
```

## Basic Usage

### 1. Import the Library

```tsx
import { PDFSigner } from '@helix/pdf-signer';
import '@helix/pdf-signer/dist/styles.css';
```

### 2. Add to Your Component

```tsx
import React, { useRef, useState } from 'react';
import { PDFSigner, PDFSignerRef } from '@helix/pdf-signer';
import '@helix/pdf-signer/dist/styles.css';

function MyApp() {
  const pdfRef = useRef<PDFSignerRef>(null);
  const [allSigned, setAllSigned] = useState(false);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PDFSigner
        ref={pdfRef}
        documentUrl="/path/to/your/document.pdf"
        onSignatureStatusChange={(allSigned, currentIndex) => {
          setAllSigned(allSigned);
          console.log(`Signature ${currentIndex + 1} status updated`);
        }}
        onSignatureApplied={(data) => {
          console.log('Signature applied:', data);
        }}
      />

      <button
        onClick={() => pdfRef.current?.nextSignature()}
        disabled={allSigned}
      >
        Next Signature
      </button>

      {allSigned && (
        <button onClick={() => {
          const signatures = pdfRef.current?.getSignatures();
          console.log('All signatures:', signatures);
          // Send to backend
        }}>
          Submit Document
        </button>
      )}
    </div>
  );
}
```

## Common Use Cases

### Get All Signatures (PSPDFKit Format)

```tsx
const handleSubmit = () => {
  const instantJSON = pdfRef.current?.getSignatures();

  // Send to backend
  fetch('/api/documents/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(instantJSON),
  });
};
```

### Navigate Signature Fields

```tsx
// Go to next unsigned signature
pdfRef.current?.nextSignature();

// Go to previous signature
pdfRef.current?.previousSignature();

// Get total count
const total = pdfRef.current?.getTotalSignatureCount();

// Go to specific page
pdfRef.current?.goToPage(3);
```

### Track Completion Status

```tsx
<PDFSigner
  documentUrl={url}
  onSignatureStatusChange={(allSigned, currentIndex) => {
    if (allSigned) {
      setMessage('All signatures completed!');
      enableSubmitButton();
    } else {
      setMessage(`Please sign field ${currentIndex + 1}`);
    }
  }}
/>
```

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/helix/pdf-signer.git
cd pdf-signer
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Development Server

```bash
pnpm dev
```

### 4. Run Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# With coverage
pnpm test -- --coverage
```

### 5. Build for Production

```bash
pnpm build
```

## Integration with Existing Projects

### Replace Nutrient SDK

**Before:**
```tsx
import NutrientViewer from '@nutrient-sdk/viewer';

<PdfViewerComponent
  jwt={docEngToken}
  onSignatureStatusChange={handleStatusChange}
/>
```

**After:**
```tsx
import { PDFSigner } from '@helix/pdf-signer';
import '@helix/pdf-signer/dist/styles.css';

<PDFSigner
  documentUrl={documentUrl}
  onSignatureStatusChange={handleStatusChange}
/>
```

### Backend Integration

**Option A: S3 Signed URLs**
```typescript
// Backend returns signed URL
POST /api/documents/generate
Response: {
  documentUrl: 'https://s3.amazonaws.com/bucket/doc.pdf?signature=...',
  expiresAt: '2024-02-07T...'
}

// Frontend uses URL directly
setDocumentUrl(response.documentUrl);
```

**Option B: Proxy Endpoint**
```typescript
// Backend proxies PDF
GET /api/documents/:id/pdf
→ Streams PDF from S3

// Frontend uses proxy URL
setDocumentUrl(`/api/documents/${docId}/pdf`);
```

## Troubleshooting

### PDF Not Loading

**Problem:** PDF fails to load

**Solution:**
1. Check document URL is accessible
2. Verify CORS headers if loading from different origin
3. Check browser console for errors
4. Ensure PDF.js worker is loading correctly

### Signature Fields Not Detected

**Problem:** No signature fields appear

**Solution:**
1. Verify PDF contains signature form fields
2. Check field type is `Sig` (signature)
3. Use Adobe Acrobat to inspect PDF form fields
4. Ensure PDF is not password protected

### Signature Not Applying

**Problem:** Signature doesn't apply to field

**Solution:**
1. Check browser console for errors
2. Verify signature canvas has content
3. Ensure field is not already signed
4. Check `onSignatureApplied` callback is firing

### Bundle Size Too Large

**Problem:** Large bundle size after installation

**Solution:**
1. Ensure using ES modules (tree-shaking)
2. Import specific components instead of entire library
3. Use dynamic imports for heavy components
4. Check build configuration for optimization

## Getting Help

- 📖 [Full Documentation](./README.md)
- 🔧 [Migration Guide](./MIGRATION_GUIDE.md)
- 🐛 [Report Issues](https://github.com/helix/pdf-signer/issues)
- 💬 [Discussions](https://github.com/helix/pdf-signer/discussions)

## Next Steps

1. ✅ Install the library
2. ✅ Try the basic example above
3. ✅ Read the [full documentation](./README.md)
4. ✅ Check the [migration guide](./MIGRATION_GUIDE.md) for advanced integration
5. ✅ Run the example demo app
6. ✅ Integrate with your backend
7. ✅ Deploy to production

## Minimum Requirements

- **React**: 18.0.0 or higher
- **Node.js**: 16.0.0 or higher
- **Browsers**:
  - Chrome/Edge 90+
  - Firefox 88+
  - Safari 14+
  - iOS Safari 14+
  - Chrome Android 90+

## License

MIT - See [LICENSE](./LICENSE) for details
