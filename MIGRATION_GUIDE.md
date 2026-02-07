# Migration Guide: Nutrient SDK → @helix/pdf-signer

This guide helps you migrate from Nutrient SDK (PSPDFKit) to @helix/pdf-signer in enrollment-ui.

## Overview

**Timeline**: 3 weeks
**Risk Level**: Low (backward compatible output format)
**Backend Changes**: Minimal (optional)

## Step 1: Install Library (Week 1)

```bash
cd enrollment-ui
pnpm add @helix/pdf-signer
```

## Step 2: Create New Component (Week 1)

Create `src/components/pdfViewer/PDFViewerV2.tsx`:

```tsx
import React, { forwardRef } from 'react';
import { PDFSigner, PDFSignerRef } from '@helix/pdf-signer';
import '@helix/pdf-signer/dist/styles.css';

interface PDFViewerV2Props {
  documentUrl: string;
  onSignatureStatusChange?: (allSigned: boolean, currentIndex: number) => void;
}

export const PDFViewerV2 = forwardRef<PDFSignerRef, PDFViewerV2Props>((props, ref) => {
  const { documentUrl, onSignatureStatusChange } = props;

  return (
    <PDFSigner
      ref={ref}
      documentUrl={documentUrl}
      onSignatureStatusChange={onSignatureStatusChange}
      onSignatureApplied={(data) => {
        console.log('Signature captured:', data);
      }}
      onError={(error) => {
        console.error('PDF Signer error:', error);
      }}
    />
  );
});

PDFViewerV2.displayName = 'PDFViewerV2';
export default PDFViewerV2;
```

## Step 3: Add Feature Flag (Week 1)

Update `src/conf/config.ts`:

```typescript
export const config = {
  // ... existing config
  featureFlags: {
    useNewPDFSigner: false, // Toggle per environment
  },
};
```

## Step 4: Update Container (Week 2)

Update `src/pages/previewDocument/Container.tsx`:

```tsx
import { config } from '../../conf/config';
import PdfViewerComponent from '../../components/pdfViewer/PDFViewer';
import PDFViewerV2 from '../../components/pdfViewer/PDFViewerV2';

const PreviewDocumentContainer = () => {
  const pdfViewerRef = useRef<PDFSignerRef>(null);
  const [documentUrl, setDocumentUrl] = useState('');
  const [docEngToken, setDocEngToken] = useState(''); // Keep for backward compat

  useEffect(() => {
    if (config.featureFlags.useNewPDFSigner) {
      // New flow: Get document URL
      getConsentDocumentUrl(requestID, email, language).then(response => {
        setDocumentUrl(response.documentUrl);
      });
    } else {
      // Old flow: Get JWT
      getConsentDocumentJWT(requestID, email, language).then(response => {
        setDocEngToken(response.jwt);
      });
    }
  }, []);

  const PDFComponent = config.featureFlags.useNewPDFSigner
    ? PDFViewerV2
    : PdfViewerComponent;

  return (
    <PDFComponent
      ref={pdfViewerRef}
      {...(config.featureFlags.useNewPDFSigner
        ? { documentUrl }
        : { jwt: docEngToken })}
      onSignatureStatusChange={(allSigned, currentIdx) => {
        setIsAllSigned(allSigned);
        setCurrentSignature(currentIdx);
      }}
    />
  );
};
```

## Step 5: Backend Updates (Week 2, Optional)

### Option A: Add Document URL Endpoint

Add to enrollment-api:

```go
// handlers/document.go

func (h *DocumentHandler) GenerateDocumentURL(w http.ResponseWriter, r *http.Request) {
    // Parse request
    var req struct {
        RequestID string `json:"requestID"`
        Email     string `json:"email"`
        Language  string `json:"language"`
    }

    // Generate S3 signed URL (15 min expiration)
    s3URL, err := h.s3Client.GeneratePresignedURL(documentKey, 15*time.Minute)

    // Return URL
    json.NewEncoder(w).Encode(map[string]interface{}{
        "documentUrl": s3URL,
        "expiresAt":   time.Now().Add(15 * time.Minute).Format(time.RFC3339),
    })
}
```

### Option B: Use Proxy Endpoint (No Changes)

Keep existing JWT endpoint, add proxy route:

```go
func (h *DocumentHandler) ProxyDocument(w http.ResponseWriter, r *http.Request) {
    requestID := chi.URLParam(r, "requestId")

    // Validate session/auth

    // Stream from S3
    obj, err := h.s3Client.GetObject(documentKey)
    defer obj.Body.Close()

    w.Header().Set("Content-Type", "application/pdf")
    io.Copy(w, obj.Body)
}
```

Frontend uses: `documentUrl="/api/enrollment/document/{requestID}/pdf"`

## Step 6: Testing (Week 2)

### Unit Tests

```bash
cd helix-pdf-signer
pnpm test
```

### Integration Testing

```bash
# Enable feature flag in dev
export FEATURE_NEW_PDF_SIGNER=true

# Test signature flow
1. Load document
2. Click signature field
3. Draw signature
4. Apply signature
5. Verify PSPDFKit JSON format
6. Submit to backend
```

### Manual Testing Checklist

- [ ] PDF loads correctly
- [ ] Signature fields are detected
- [ ] Draw signature works
- [ ] Type signature works
- [ ] Clear/cancel works
- [ ] Next signature navigation works
- [ ] All fields signed shows complete state
- [ ] Submit sends correct format to backend
- [ ] Mobile touch works
- [ ] Keyboard navigation works

## Step 7: Gradual Rollout (Week 3)

### Week 3, Day 1: 10% of Users

```typescript
// config.ts
featureFlags: {
  useNewPDFSigner: shouldUseNewSigner(userId), // 10% rollout
}

function shouldUseNewSigner(userId: string): boolean {
  const hash = hashCode(userId);
  return hash % 100 < 10; // 10% of users
}
```

Monitor:
- Error rates
- Signature completion rates
- Backend submission success

### Week 3, Day 3: 50% of Users

```typescript
return hash % 100 < 50; // 50% of users
```

### Week 3, Day 5: 100% Rollout

```typescript
useNewPDFSigner: true, // All users
```

## Step 8: Cleanup (Week 4)

After successful rollout:

1. Remove Nutrient SDK dependency:
```bash
pnpm remove @nutrient-sdk/viewer
```

2. Delete old component:
```bash
rm src/components/pdfViewer/PDFViewer.tsx
```

3. Rename PDFViewerV2 to PDFViewer:
```bash
mv src/components/pdfViewer/PDFViewerV2.tsx src/components/pdfViewer/PDFViewer.tsx
```

4. Remove feature flag logic

5. Update backend to remove JWT generation (if using Option A)

## Rollback Plan

If issues occur:

1. Set feature flag to `false`:
```typescript
useNewPDFSigner: false
```

2. Redeploy frontend

3. Monitor until stable

4. Investigate issues

5. Fix and re-enable

## Monitoring

Track these metrics:

- **Signature completion rate**: Should remain stable
- **Error rate**: Should not increase
- **Page load time**: Should improve (smaller bundle)
- **Backend submission errors**: Should remain at 0%

## Support

For issues:
1. Check browser console for errors
2. Verify document URL is accessible
3. Check backend logs for submission errors
4. Open GitHub issue with details

## Cost Savings

After migration:
- ✅ Zero Nutrient licensing costs
- ✅ No Nutrient DocEngine infrastructure
- ✅ Reduced bundle size (~200KB → ~100KB)
- ✅ Full control over UI/UX
