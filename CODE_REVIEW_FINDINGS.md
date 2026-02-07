# Code Review Findings & Action Items

## 📋 Review Summary

**Date**: 2026-02-07
**Reviewer**: everything-claude-code:code-reviewer agent
**Status**: ⛔ **BLOCKED** - Critical issues must be fixed before production

---

## 🚨 CRITICAL Issues (Must Fix Immediately)

### 1. Memory Leak - PDF Document Not Disposed
**Severity**: CRITICAL
**File**: `src/hooks/usePDFDocument.ts:45-47`
**Impact**: Memory leak accumulates with each document load

**Current Code**:
```typescript
return () => {
  cancelled = true;
};
```

**Required Fix**:
```typescript
return () => {
  cancelled = true;
  // Clean up PDF document to prevent memory leak
  if (document) {
    document.destroy();
  }
};
```

---

### 2. Missing URL Validation - Security Vulnerability
**Severity**: CRITICAL
**File**: `src/hooks/usePDFDocument.ts:27`
**Impact**: Potential path traversal, loading malicious documents

**Required Fix**: Add URL validation before loading
```typescript
function validateDocumentUrl(url: string): boolean {
  const allowedProtocols = ['https:', 'blob:', 'data:'];
  try {
    const parsed = new URL(url, window.location.origin);
    return allowed Protocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

// In loadDocument:
if (!validateDocumentUrl(documentUrl)) {
  throw new Error('Invalid document URL protocol');
}
```

---

### 3. CFR Part 11 Compliance - Missing Required Fields
**Severity**: CRITICAL (for healthcare context)
**File**: `src/types/index.ts:18-23`
**Impact**: Non-compliant with FDA CFR Part 11 regulations

**Current SignatureData is insufficient**:
```typescript
export interface SignatureData {
  type: 'drawn' | 'typed';
  data: string;
  timestamp: string;
  userAgent?: string;
}
```

**Required for CFR Part 11**:
```typescript
export interface SignatureData {
  // Existing fields
  type: 'drawn' | 'typed';
  data: string;
  timestamp: string;
  userAgent?: string;

  // CFR Part 11 required fields
  signerName: string;           // REQUIRED: Printed name
  signerIntent: string;         // REQUIRED: Meaning (e.g., "I approve")

  // Recommended for audit trail
  ipAddress?: string;           // For audit trail
  sessionId?: string;           // For audit trail
  signatureHash?: string;       // Integrity verification
}
```

---

### 4. CDN Dependency - Security & Reliability Risk
**Severity**: HIGH
**File**: `src/hooks/usePDFDocument.ts:6`
**Impact**: Supply chain attack vector, CDN outage = broken app

**Current**:
```typescript
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
```

**Fix Options**:

**Option A - Copy worker to public folder** (Simplest):
```bash
# In build script
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/
```

```typescript
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
```

**Option B - Bundle with Vite** (Recommended):
```typescript
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
```

---

## ⚠️ HIGH Priority Issues (Should Fix)

### 5. Non-Null Assertion on Potentially Undefined Field
**File**: `src/components/PDFViewer/PDFViewer.tsx:113`

**Current - Unsafe**:
```typescript
field: field!,  // Can throw if undefined
```

**Fix - Safe**:
```typescript
getSignatures: () => {
  const signatureMap = new Map(
    Array.from(signatures.entries())
      .map(([fieldId, data]) => {
        const field = signatureFields.find((f) => f.id === fieldId);
        const dimensions = field ? pageDimensions.get(field.pageIndex + 1) : null;

        // Skip if field not found
        if (!field) {
          console.warn(`Signature field ${fieldId} not found`);
          return null;
        }

        return [
          fieldId,
          {
            data,
            field,
            pageHeight: dimensions?.height || DEFAULT_PAGE_HEIGHT,
          },
        ];
      })
      .filter((entry): entry is [string, any] => entry !== null)
  );
  return createPSPDFKitInstantJSON(signatureMap);
}
```

---

### 6. Missing Data URL Validation
**File**: `src/components/SignatureCapture/SignaturePreview.tsx:15`

**Add validation**:
```typescript
function isValidImageDataUrl(url: string): boolean {
  return /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(url);
}

export const SignaturePreview: React.FC<SignaturePreviewProps> = ({
  dataUrl,
  onApply,
  onEdit,
}) => {
  if (!isValidImageDataUrl(dataUrl)) {
    return <div className="error">Invalid signature data</div>;
  }

  // ... rest of component
}
```

---

### 7. Remove `any` Type Usage
**File**: `src/components/PDFViewer/PDFViewer.tsx:63`

**Fix**:
```typescript
const handleSignatureComplete = (data: SignatureData) => {
  // ... implementation
};
```

---

### 8. Missing Error Boundary
**Recommendation**: Wrap PDF rendering in error boundary

Create `src/components/PDFViewer/PDFErrorBoundary.tsx`:
```typescript
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class PDFErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PDF rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="pdf-error">
          <h2>Error Loading PDF</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Use in PDFViewer.tsx:
```typescript
<PDFErrorBoundary>
  <Document file={documentUrl}>
    {/* ... */}
  </Document>
</PDFErrorBoundary>
```

---

### 9. Insufficient Test Coverage
**Current**: 3 unit tests only

**Required**: Add tests for:
- PDF document cleanup (memory leak test)
- URL validation
- Error boundaries
- Signature application workflow
- CFR Part 11 metadata capture
- Accessibility (keyboard navigation)

---

## 📝 MEDIUM Priority Warnings

### 10. Performance - signedFieldIds Recreated Every Render
**File**: `src/components/PDFViewer/PDFViewer.tsx:41`

**Fix with useMemo**:
```typescript
const signedFieldIds = useMemo(
  () => new Set(signatures.keys()),
  [signatures]
);
```

---

### 11. Callback Reference Stability
**File**: `src/components/PDFViewer/PDFViewer.tsx:53-55`

**Fix with ref pattern**:
```typescript
const onSignatureStatusChangeRef = useRef(onSignatureStatusChange);
onSignatureStatusChangeRef.current = onSignatureStatusChange;

useEffect(() => {
  onSignatureStatusChangeRef.current?.(allSigned, currentIndex);
}, [allSigned, currentIndex]);
```

---

### 12. Deprecated `substr()` Usage
**File**: `src/utils/signature-utils.ts:107`

**Fix**:
```typescript
// Before
Math.random().toString(36).substr(2, 9)

// After
Math.random().toString(36).slice(2, 11)
```

---

### 13. Accessibility - Missing ARIA Attributes
**File**: `src/components/SignatureCapture/SignatureDialog.tsx:42`

**Add ARIA**:
```typescript
<div
  className="signature-dialog"
  role="dialog"
  aria-modal="true"
  aria-labelledby="signature-dialog-title"
  onClick={(e) => e.stopPropagation()}
>
  <div className="signature-dialog-header">
    <h2 id="signature-dialog-title">Sign Here</h2>
    {/* ... */}
  </div>
```

---

### 14. Focus Trap Missing in Modal
**Recommendation**: Implement focus trap in SignatureDialog

Use library like `focus-trap-react` or implement manually:
```typescript
useEffect(() => {
  if (!isOpen) return;

  const dialog = dialogRef.current;
  const focusableElements = dialog.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  // Focus first element
  firstElement?.focus();

  // Trap focus
  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  dialog.addEventListener('keydown', handleTab);
  return () => dialog.removeEventListener('keydown', handleTab);
}, [isOpen]);
```

---

## 💡 LOW Priority Suggestions

### 15. Use crypto.randomUUID() for IDs
**File**: `src/utils/signature-utils.ts:106`

```typescript
export function generateSignatureId(): string {
  return `sig-${crypto.randomUUID()}`;
}
```

---

### 16. Extract Magic Numbers to Constants
**File**: `src/components/PDFViewer/Toolbar.tsx:16-21`

```typescript
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;
const ZOOM_STEP = 0.25;
const DEFAULT_PAGE_HEIGHT = 792; // US Letter at 72 DPI
```

---

### 17. convertTextToInkLines Doesn't Convert Text
**File**: `src/utils/signature-utils.ts:57-73`

**Issue**: Function ignores `text` parameter, only draws horizontal line

**Note**: This may be intentional for MVP. For PSPDFKit compatibility with typed signatures, consider:
1. Keeping typed signatures as image annotations (current approach)
2. Documenting limitation in comments
3. Planning enhancement for Phase 2

---

## 📊 Summary Statistics

| Category | Count |
|----------|-------|
| Critical Issues | 4 |
| High Priority | 5 |
| Medium Priority | 9 |
| Low Priority | 3 |
| **Total** | **21** |

---

## ✅ Action Plan

### Immediate (Before ANY Testing)
1. ✅ Fix memory leak (PDF document cleanup)
2. ✅ Add URL validation
3. ✅ Add data URL validation
4. ✅ Fix non-null assertion

### Before Production (CFR Part 11 Compliance)
5. ✅ Extend SignatureData interface with required fields
6. ✅ Bundle PDF.js worker locally (remove CDN)
7. ✅ Add error boundary
8. ✅ Increase test coverage to >70%

### Important but Not Blocking
9. ⏳ Fix TypeScript `any` types
10. ⏳ Add useMemo optimizations
11. ⏳ Improve accessibility (ARIA, focus trap)
12. ⏳ Fix deprecated substr()

### Nice to Have (Phase 2)
13. ⏳ Use crypto.randomUUID()
14. ⏳ Extract magic numbers
15. ⏳ Improve convertTextToInkLines

---

## 🎯 Recommendation

**BLOCK** - Do not proceed to production until Critical and High priority issues are resolved.

**Estimated fix time**:
- Critical fixes: 4-6 hours
- High priority fixes: 8-12 hours
- **Total**: 1-2 days for production-ready code

---

## 📚 Additional Resources

- [CFR Part 11 Requirements](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/part-11-electronic-records-electronic-signatures-scope-and-application)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [WCAG 2.1 Modal Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [PDF.js Worker Configuration](https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions#worker)

---

**Next Steps**: Review this document, prioritize fixes, and create tracking issues for each item.
