# Manual Testing Guide

This guide walks you through manually testing the @helix/pdf-signer library locally.

## Prerequisites

- Node.js 16+ installed
- pnpm installed (`npm install -g pnpm`)
- A sample PDF with signature fields

## Setup

### 1. Install Dependencies

```bash
cd helix-pdf-signer
pnpm install
```

### 2. Get a Sample PDF with Signature Fields

You need a PDF that contains signature form fields. You can:

**Option A: Create one with Adobe Acrobat**
1. Open any PDF in Adobe Acrobat Pro
2. Go to Tools → Prepare Form
3. Add signature fields to the document
4. Save the PDF

**Option B: Use an online tool**
1. Go to [PDFescape](https://www.pdfescape.com/) or similar
2. Upload a PDF
3. Add signature form fields
4. Download the modified PDF

**Option C: Use a sample document**
```bash
# Download a sample consent form with signature fields
curl -o public/sample-document.pdf \
  "https://www.irs.gov/pub/irs-pdf/fw9.pdf"
```

### 3. Create a Public Directory

```bash
mkdir -p public
# Copy your PDF with signature fields
cp /path/to/your/signed-pdf.pdf public/sample-document.pdf
```

## Method 1: Development Server (Recommended)

### Create a Test App

Create `index.html` in the root directory:

```bash
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF Signer Test</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: sans-serif;
    }
    #root {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .controls {
      padding: 16px;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    button {
      padding: 8px 16px;
      border: 1px solid #ccc;
      background: white;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background: #f0f0f0;
    }
    button.primary {
      background: #2196F3;
      color: white;
      border-color: #2196F3;
    }
    .status {
      padding: 8px 16px;
      background: #E3F2FD;
      border-radius: 4px;
    }
    #viewer {
      flex: 1;
      background: white;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="controls">
      <h2 style="margin: 0;">PDF Signer Test</h2>
      <button id="nextBtn">Next Signature</button>
      <button id="prevBtn">Previous Signature</button>
      <button id="getJsonBtn" class="primary">Get InstantJSON</button>
      <div class="status" id="status">Loading...</div>
    </div>
    <div id="viewer"></div>
  </div>
  <script type="module" src="/test-app.tsx"></script>
</body>
</html>
EOF
```

Create `test-app.tsx`:

```bash
cat > test-app.tsx << 'EOF'
import React, { useRef, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { PDFSigner, PDFSignerRef } from './src/index';
import './src/styles.css';

const TestApp: React.FC = () => {
  const pdfRef = useRef<PDFSignerRef>(null);
  const [status, setStatus] = useState('Loading PDF...');

  useEffect(() => {
    document.getElementById('nextBtn')?.addEventListener('click', () => {
      pdfRef.current?.nextSignature();
    });

    document.getElementById('prevBtn')?.addEventListener('click', () => {
      pdfRef.current?.previousSignature();
    });

    document.getElementById('getJsonBtn')?.addEventListener('click', () => {
      const json = pdfRef.current?.getSignatures();
      console.log('InstantJSON:', JSON.stringify(json, null, 2));
      alert('InstantJSON output logged to console (F12)');
    });
  }, []);

  return (
    <PDFSigner
      ref={pdfRef}
      documentUrl="/sample-document.pdf"
      onSignatureStatusChange={(allSigned, currentIndex) => {
        const total = pdfRef.current?.getTotalSignatureCount() || 0;
        if (allSigned) {
          setStatus(`✅ All ${total} signatures completed!`);
          document.getElementById('status')!.textContent = `✅ All ${total} signatures completed!`;
        } else {
          setStatus(`Signature ${currentIndex + 1} of ${total}`);
          document.getElementById('status')!.textContent = `Signature ${currentIndex + 1} of ${total}`;
        }
      }}
      onSignatureApplied={(data) => {
        console.log('Signature applied:', data);
      }}
      onError={(error) => {
        console.error('Error:', error);
        setStatus(`Error: ${error.message}`);
        document.getElementById('status')!.textContent = `Error: ${error.message}`;
      }}
    />
  );
};

const root = document.getElementById('viewer');
if (root) {
  createRoot(root).render(<TestApp />);
}
EOF
```

### Start Development Server

```bash
pnpm dev
```

This will start Vite dev server on `http://localhost:5173`

Open your browser to `http://localhost:5173` and you should see the PDF viewer.

## Method 2: Build and Test in HTML

### Build the Library

```bash
pnpm build
```

### Create Test HTML File

```bash
cat > test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>PDF Signer Test</title>
  <link rel="stylesheet" href="./dist/styles.css">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
</head>
<body>
  <div id="root" style="height: 100vh;"></div>
  <script type="module">
    import { PDFSigner } from './dist/index.mjs';

    const { createElement, useRef } = React;
    const { createRoot } = ReactDOM;

    const App = () => {
      const pdfRef = useRef(null);

      return createElement(PDFSigner, {
        ref: pdfRef,
        documentUrl: './public/sample-document.pdf',
        onSignatureStatusChange: (allSigned, idx) => {
          console.log('Status:', allSigned, idx);
        }
      });
    };

    createRoot(document.getElementById('root')).render(createElement(App));
  </script>
</body>
</html>
EOF
```

### Serve with Simple HTTP Server

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Open `http://localhost:8000/test.html`

## Method 3: Test in Another React App

### Create a Test React App

```bash
cd ..
npx create-react-app test-pdf-signer
cd test-pdf-signer
```

### Link Your Library

```bash
cd ../helix-pdf-signer
pnpm link

cd ../test-pdf-signer
pnpm link @helix/pdf-signer
```

### Update `src/App.js`

```jsx
import React, { useRef, useState } from 'react';
import { PDFSigner } from '@helix/pdf-signer';
import '@helix/pdf-signer/dist/styles.css';
import './App.css';

function App() {
  const pdfRef = useRef(null);
  const [allSigned, setAllSigned] = useState(false);

  return (
    <div className="App" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
        <button onClick={() => pdfRef.current?.nextSignature()}>
          Next Signature
        </button>
        <button onClick={() => {
          const json = pdfRef.current?.getSignatures();
          console.log('InstantJSON:', json);
        }}>
          Get JSON
        </button>
        {allSigned && <span style={{ color: 'green', marginLeft: '16px' }}>✓ All Signed</span>}
      </div>

      <div style={{ flex: 1 }}>
        <PDFSigner
          ref={pdfRef}
          documentUrl="/sample-document.pdf"
          onSignatureStatusChange={(signed) => setAllSigned(signed)}
        />
      </div>
    </div>
  );
}

export default App;
```

### Add Sample PDF

```bash
cp ../helix-pdf-signer/public/sample-document.pdf public/
```

### Start App

```bash
npm start
```

## Testing Checklist

### Basic Functionality

- [ ] **PDF loads and displays**
  - Open the test app
  - Verify PDF renders on screen
  - Check all pages load correctly

- [ ] **Navigation works**
  - Click "Next Page" button
  - Click "Previous Page" button
  - Verify page number updates

- [ ] **Zoom controls work**
  - Click zoom in (+)
  - Click zoom out (-)
  - Click "Fit Width"
  - Verify PDF scales correctly

### Signature Fields

- [ ] **Fields are detected**
  - Verify signature fields appear as overlays
  - Check field highlighting (blue dashed border)
  - Verify "Click to Sign" text appears

- [ ] **Field click opens dialog**
  - Click on a signature field
  - Verify modal dialog opens
  - Check "Draw" and "Type" tabs appear

### Drawing Signature

- [ ] **Canvas drawing works**
  - Select "Draw" tab
  - Draw on canvas with mouse
  - Verify lines appear smoothly
  - Try different drawing speeds

- [ ] **Touch drawing works** (mobile/tablet)
  - Use finger or stylus to draw
  - Verify touch events work
  - Check pressure sensitivity (if supported)

- [ ] **Clear button works**
  - Draw something
  - Click "Clear"
  - Verify canvas is wiped

- [ ] **Apply signature works**
  - Draw signature
  - Click "Apply Signature"
  - Verify dialog closes
  - Check signature appears in field
  - Verify field changes to green with checkmark

### Typed Signature

- [ ] **Type signature works**
  - Click signature field
  - Select "Type" tab
  - Type your name
  - Verify preview updates

- [ ] **Font selection works**
  - Try different font options
  - Verify preview changes font style

- [ ] **Apply typed signature**
  - Type name
  - Click "Apply Signature"
  - Verify signature appears in field

### Multiple Signatures

- [ ] **Next signature navigation**
  - Sign first field
  - Click "Next Signature"
  - Verify jumps to next unsigned field
  - Verify dialog opens automatically

- [ ] **All signatures completed**
  - Sign all required fields
  - Verify status shows "All signed"
  - Check that "Next" button is disabled

### Output Format

- [ ] **InstantJSON output**
  - Sign at least one field
  - Click "Get InstantJSON"
  - Open browser console (F12)
  - Verify JSON structure:
    ```json
    {
      "format": "https://pspdfkit.com/instant-json/v1",
      "annotations": [...],
      "attachments": {...}
    }
    ```
  - Check annotations array has entries
  - Verify attachments contain base64 image data

### Error Handling

- [ ] **Invalid PDF URL**
  - Change documentUrl to invalid path
  - Verify error message displays
  - Check console for error details

- [ ] **Network error**
  - Disconnect internet (if using remote PDF)
  - Verify error handling
  - Check error callback fires

### Accessibility

- [ ] **Keyboard navigation**
  - Tab to signature field
  - Press Enter to open dialog
  - Tab through dialog controls
  - Press Escape to close dialog

- [ ] **Screen reader** (if available)
  - Enable screen reader
  - Verify labels are announced
  - Check field states are announced

### Mobile Testing

- [ ] **Responsive design**
  - Resize browser window
  - Test on mobile device
  - Verify toolbar stacks properly
  - Check dialog fits screen

- [ ] **Touch gestures**
  - Pinch to zoom
  - Swipe to scroll
  - Tap to sign
  - Draw signature with finger

## Debugging Tips

### PDF Not Loading

```bash
# Check if PDF exists
ls -la public/sample-document.pdf

# Check browser console (F12)
# Look for CORS errors or 404 errors

# Try opening PDF directly
open http://localhost:5173/sample-document.pdf
```

### Signature Fields Not Appearing

```javascript
// Add debug logging to usePDFDocument hook
console.log('Document loaded:', document);
console.log('Annotations:', await page.getAnnotations());

// Check if PDF has signature fields in Adobe Acrobat
// Tools → Prepare Form → Check for "Signature" fields
```

### Canvas Not Drawing

```javascript
// Check canvas context
const canvas = document.querySelector('canvas');
console.log('Canvas:', canvas);
console.log('Context:', canvas.getContext('2d'));

// Verify signature_pad is loaded
console.log('SignaturePad:', window.SignaturePad);
```

### InstantJSON Empty

```javascript
// Debug in PDFViewer component
console.log('Signatures map:', signatures);
console.log('Signed field IDs:', Array.from(signatures.keys()));
console.log('Page dimensions:', pageDimensions);
```

## Testing with Real Backend

To test with enrollment-api backend:

1. Start enrollment-api locally
2. Get a real document URL from the API
3. Update `documentUrl` prop:

```typescript
const [documentUrl, setDocumentUrl] = useState('');

useEffect(() => {
  fetch('http://localhost:8080/api/enrollment/document/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestID: 'test-123',
      email: 'test@example.com',
      language: 'en'
    })
  })
  .then(res => res.json())
  .then(data => setDocumentUrl(data.documentUrl));
}, []);
```

4. Test signature submission:

```typescript
const handleSubmit = async () => {
  const instantJSON = pdfRef.current?.getSignatures();

  const response = await fetch('http://localhost:8080/api/enrollment/document/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestID: 'test-123',
      annotations: instantJSON
    })
  });

  console.log('Submit response:', await response.json());
};
```

## Performance Testing

Monitor these metrics while testing:

```javascript
// Measure load time
console.time('PDF Load');
// ... load PDF
console.timeEnd('PDF Load');

// Measure signature capture time
console.time('Signature Capture');
// ... draw and apply signature
console.timeEnd('Signature Capture');

// Check memory usage
console.log('Memory:', performance.memory);

// Monitor bundle size
console.log('Loaded scripts:', performance.getEntriesByType('resource')
  .filter(r => r.name.includes('.js'))
  .map(r => ({ name: r.name, size: r.transferSize }))
);
```

## Next Steps

After manual testing:

1. Run automated tests: `pnpm test`
2. Run E2E tests: `pnpm test:e2e`
3. Build for production: `pnpm build`
4. Test built version with `test.html`
5. Integrate into enrollment-ui
