# Architecture Documentation

## Project Structure

```
helix-pdf-signer/
├── 📦 Configuration
│   ├── package.json              # NPM package configuration
│   ├── tsconfig.json             # TypeScript compiler config
│   ├── vite.config.ts            # Vite build tool config
│   ├── jest.config.js            # Jest test runner config
│   ├── playwright.config.ts      # Playwright E2E config
│   ├── .eslintrc.json           # ESLint linter config
│   └── .gitignore               # Git ignore rules
│
├── 📝 Documentation
│   ├── README.md                 # Main documentation
│   ├── QUICK_START.md            # 5-minute getting started
│   ├── MIGRATION_GUIDE.md        # Nutrient SDK migration
│   ├── IMPLEMENTATION_SUMMARY.md # Technical details
│   ├── ARCHITECTURE.md           # This file
│   ├── CHANGELOG.md              # Version history
│   ├── CONTRIBUTING.md           # Contribution guide
│   ├── PROJECT_COMPLETE.md       # Project completion summary
│   └── LICENSE                   # MIT license
│
├── 📁 src/                      # Source code
│   ├── components/
│   │   ├── PDFViewer/
│   │   │   ├── PDFViewer.tsx              # 🎯 Main component
│   │   │   ├── PDFPage.tsx                # Page renderer
│   │   │   ├── SignatureFieldOverlay.tsx  # Field overlay
│   │   │   └── Toolbar.tsx                # Navigation toolbar
│   │   └── SignatureCapture/
│   │       ├── SignatureDialog.tsx        # 🎯 Modal dialog
│   │       ├── SignatureCanvas.tsx        # Canvas drawing
│   │       ├── SignatureTyped.tsx         # Typed signature
│   │       └── SignaturePreview.tsx       # Preview component
│   ├── hooks/
│   │   ├── usePDFDocument.ts             # PDF.js integration
│   │   ├── useSignatureFields.ts         # Field detection
│   │   ├── useSignatureCapture.ts        # Signature state
│   │   └── useSignatureStatus.ts         # Completion tracking
│   ├── utils/
│   │   ├── pdf-utils.ts                  # PDF parsing helpers
│   │   └── signature-utils.ts            # PSPDFKit conversion
│   ├── types/
│   │   └── index.ts                      # TypeScript definitions
│   ├── index.ts                          # 🎯 Public API exports
│   └── styles.css                        # Component styles
│
├── 🧪 tests/                    # Test suite
│   ├── unit/
│   │   └── PDFViewer.test.tsx            # Component unit tests
│   ├── e2e/
│   │   └── signature-flow.spec.ts        # End-to-end tests
│   └── setup.ts                          # Test environment setup
│
└── 📚 examples/                 # Usage examples
    ├── enrollment-ui-integration.tsx     # Integration example
    └── demo-app/
        ├── index.html                    # Demo HTML
        └── demo.tsx                      # Demo application

```

## Component Architecture

```
┌─────────────────────────────────────────────────────┐
│                   PDFSigner                         │
│  (Main component with ref API)                      │
└─────────────┬───────────────────────────────────────┘
              │
              ├──> usePDFDocument (hook)
              │    └──> PDF.js integration
              │
              ├──> useSignatureFields (hook)
              │    └──> Extract fields from PDF
              │
              ├──> useSignatureCapture (hook)
              │    └──> Manage signature state
              │
              ├──> useSignatureStatus (hook)
              │    └──> Track completion
              │
              ├──> Toolbar
              │    ├──> Page navigation
              │    ├──> Zoom controls
              │    └──> Signature navigation
              │
              ├──> PDFPage
              │    ├──> react-pdf renderer
              │    └──> SignatureFieldOverlay (multiple)
              │         ├──> Visual indicator
              │         ├──> Click handler
              │         └──> Keyboard support
              │
              └──> SignatureDialog
                   ├──> SignatureCanvas (draw mode)
                   │    └──> signature_pad library
                   ├──> SignatureTyped (type mode)
                   │    └──> Font selection + canvas render
                   └──> SignaturePreview
                        ├──> Image preview
                        └──> Apply/Edit actions
```

## Data Flow

```
┌─────────────┐
│   User      │
│  Actions    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  PDFSigner Component                    │
│  ┌─────────────────────────────────┐   │
│  │ State Management                │   │
│  │ • document: PDFDocumentProxy    │   │
│  │ • signatures: Map<id, data>     │   │
│  │ • currentPage: number           │   │
│  │ • zoom: number                  │   │
│  └─────────────────────────────────┘   │
└───────────┬─────────────────────────────┘
            │
            ├──> PDF.js
            │    └──> Load & parse document
            │         └──> Extract signature fields
            │
            ├──> signature_pad
            │    └──> Capture drawn signature
            │         └──> Convert to PNG data URL
            │
            └──> signature-utils
                 └──> Convert to PSPDFKit format
                      └──> Output InstantJSON
                           │
                           ▼
                    ┌─────────────┐
                    │   Backend   │
                    │   (S3 + API)│
                    └─────────────┘
```

## State Management

### Component State

```typescript
// PDFViewer.tsx
const [pageNumber, setPageNumber] = useState(1);
const [zoom, setZoom] = useState(1.0);
const [pageDimensions, setPageDimensions] = useState<Map>(...);

// useSignatureCapture hook
const [signatures, setSignatures] = useState<Map<string, SignatureData>>(new Map());
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [currentField, setCurrentField] = useState<SignatureField | null>(null);
```

### Data Types

```typescript
interface SignatureField {
  id: string;                    // Unique identifier
  pageIndex: number;             // Zero-based page number
  fieldName: string;             // PDF field name
  boundingBox: BoundingBox;      // Position and size
  required: boolean;             // Is signature required
  signedBy: string | null;       // User who signed
  signedAt: string | null;       // ISO timestamp
}

interface SignatureData {
  type: 'drawn' | 'typed';       // Signature method
  data: string;                  // Data URL (PNG)
  timestamp: string;             // ISO timestamp
  userAgent?: string;            // Browser info
}

interface PSPDFKitInstantJSON {
  format: 'https://pspdfkit.com/instant-json/v1';
  annotations: PSPDFKitAnnotation[];
  attachments?: Record<string, {
    contentType: string;
    data: string;                // Base64
  }>;
}
```

## API Design

### Public API

```typescript
// Main component
export { PDFSigner } from './components/PDFViewer/PDFViewer';

// Component props
interface PDFSignerProps {
  documentUrl: string;
  onSignatureStatusChange?: (allSigned: boolean, currentIndex: number) => void;
  onSignatureApplied?: (data: SignatureData) => void;
  onError?: (error: Error) => void;
  // ... other props
}

// Ref methods
interface PDFSignerRef {
  nextSignature: () => void;
  previousSignature: () => void;
  getTotalSignatureCount: () => number;
  getSignatures: () => PSPDFKitInstantJSON;
  goToPage: (pageNumber: number) => void;
  updateSignatureStatus: () => void;
}
```

### Usage Pattern

```typescript
// 1. Create ref
const pdfRef = useRef<PDFSignerRef>(null);

// 2. Render component
<PDFSigner
  ref={pdfRef}
  documentUrl={url}
  onSignatureStatusChange={(allSigned, idx) => {...}}
/>

// 3. Use imperative methods
pdfRef.current.nextSignature();
const json = pdfRef.current.getSignatures();
```

## Integration Points

### External Dependencies

```
┌──────────────────┐
│   PDF.js/        │  PDF rendering
│   react-pdf      │  and parsing
└────────┬─────────┘
         │
┌────────▼─────────┐
│  @helix/         │
│  pdf-signer      │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  signature_pad   │  Canvas-based
└──────────────────┘  signature drawing
```

### Backend Integration

```
Frontend                    Backend
┌─────────────┐            ┌──────────────┐
│ PDFSigner   │            │ enrollment-  │
│             │──GET──────>│ api          │
│             │<──PDF──────│              │
│             │            │              │
│             │──POST─────>│              │
│             │ InstantJSON│              │
└─────────────┘            └──────┬───────┘
                                  │
                           ┌──────▼───────┐
                           │   S3 + KMS   │
                           │   DynamoDB   │
                           └──────────────┘
```

## Build Process

```
Source Code (TypeScript + React)
       │
       ▼
┌──────────────┐
│ TypeScript   │  Type checking
│ Compiler     │  and transpilation
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Vite         │  Bundle optimization
│ Bundler      │  Tree shaking
└──────┬───────┘  Code splitting
       │
       ▼
┌──────────────┐
│ Output       │
│ • index.js   │  CommonJS
│ • index.mjs  │  ES modules
│ • index.d.ts │  Type definitions
│ • styles.css │  Styles
└──────────────┘
```

## Performance Optimization

### Bundle Size Optimization
- Tree-shaking enabled (ES modules)
- External peer dependencies (React)
- CSS in separate file
- No unnecessary polyfills

### Runtime Optimization
- Virtualized page rendering
- Lazy loading of PDF pages
- Memoized computations (useMemo)
- Debounced zoom/scroll handlers
- Canvas reuse for signature capture

### Memory Management
- Cleanup in useEffect returns
- PDF.js document disposal
- Canvas context cleanup
- Event listener removal

## Testing Strategy

### Unit Tests (Jest)
```
src/
├── hooks/
│   ├── usePDFDocument.test.ts
│   ├── useSignatureFields.test.ts
│   └── useSignatureCapture.test.ts
├── utils/
│   ├── pdf-utils.test.ts
│   └── signature-utils.test.ts
└── components/
    └── PDFViewer.test.tsx
```

### Integration Tests
```
tests/integration/
├── signature-workflow.test.tsx
├── navigation.test.tsx
└── error-handling.test.tsx
```

### E2E Tests (Playwright)
```
tests/e2e/
├── signature-flow.spec.ts
├── mobile-interaction.spec.ts
└── keyboard-navigation.spec.ts
```

## Security Considerations

### Client-Side Security
- No sensitive data in localStorage
- Signature data sent immediately to backend
- CORS-compliant document loading
- XSS prevention (React escaping)

### Backend Security (Existing)
- JWT authentication
- S3 signed URLs
- KMS encryption
- DynamoDB security

## Browser Compatibility

### Supported Browsers
- Chrome/Edge 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- iOS Safari 14+ ✅
- Chrome Android 90+ ✅

### Polyfills Required
- None (using native browser APIs)

### Feature Detection
- Canvas support (required)
- Touch events (optional)
- Pointer events (optional)

## Deployment

### NPM Package Structure
```
@helix/pdf-signer@1.0.0/
├── dist/
│   ├── index.js          # CommonJS
│   ├── index.mjs         # ES module
│   ├── index.d.ts        # TypeScript definitions
│   └── styles.css        # Styles
├── package.json
├── README.md
└── LICENSE
```

### Installation
```bash
npm install @helix/pdf-signer
```

### Usage in enrollment-ui
```typescript
import { PDFSigner } from '@helix/pdf-signer';
import '@helix/pdf-signer/dist/styles.css';
```

## Future Enhancements

### Phase 2 Features
- Image upload signatures
- Signature editing/deletion
- Multi-user signatures
- Signature templates
- Enhanced audit logging

### Phase 3 Features
- Offline signature support
- Full PDF form support
- Document comparison
- Advanced zoom controls
- Page thumbnails
- Search within PDF

## Maintenance

### Version Strategy
- Semantic versioning (semver)
- Changelog for all releases
- Migration guides for breaking changes
- Deprecation warnings before removal

### Upgrade Path
1. Minor updates: backward compatible
2. Major updates: migration guide provided
3. Security patches: immediate release

## Monitoring

### Key Metrics
- Bundle size
- Load time
- Signature capture time
- Error rate
- Browser compatibility

### Error Tracking
- PDF load failures
- Signature capture errors
- Browser compatibility issues
- Network errors

## Documentation Strategy

### User Documentation
- README.md - Overview and API
- QUICK_START.md - Getting started
- MIGRATION_GUIDE.md - Migration steps
- Examples - Code samples

### Developer Documentation
- ARCHITECTURE.md - This file
- CONTRIBUTING.md - How to contribute
- Inline JSDoc comments
- TypeScript types as documentation

### End-User Documentation
- enrollment-ui integration guide
- Troubleshooting guide
- FAQ
- Support channels
