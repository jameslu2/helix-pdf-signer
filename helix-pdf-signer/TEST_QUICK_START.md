# Quick Test Guide - Get Running in 2 Minutes

## Step 1: Install Dependencies (30 seconds)

```bash
cd helix-pdf-signer
pnpm install
```

## Step 2: Add a Sample PDF (1 minute)

You need a PDF with signature fields. Choose one option:

### Option A: Download Sample IRS Form (has signature fields)
```bash
curl -o public/sample-document.pdf "https://www.irs.gov/pub/irs-pdf/fw9.pdf"
```

### Option B: Use Your Own PDF
If you have a PDF with signature fields:
```bash
cp /path/to/your/pdf-with-signatures.pdf public/sample-document.pdf
```

### Option C: Create One
1. Go to https://www.pdfescape.com/
2. Upload any PDF
3. Add signature fields (the pen icon)
4. Download and save as `public/sample-document.pdf`

## Step 3: Start Dev Server (10 seconds)

```bash
pnpm dev
```

## Step 4: Open Browser (10 seconds)

Open: **http://localhost:5173**

## Step 5: Test! (30 seconds)

1. Click **"Load PDF"** button
2. Click on a blue signature field
3. Draw your signature in the dialog
4. Click **"Apply Signature"**
5. Click **"Get InstantJSON"** to see output

## Troubleshooting

### "No signature fields detected"
Your PDF doesn't have signature form fields. Try the IRS Form W-9:
```bash
curl -o public/sample-document.pdf "https://www.irs.gov/pub/irs-pdf/fw9.pdf"
```

### "Error loading PDF"
```bash
# Make sure file exists
ls -la public/sample-document.pdf

# Try a different PDF
curl -o public/sample-document.pdf "https://www.irs.gov/pub/irs-pdf/fw4.pdf"
```

### Port already in use
```bash
# Use a different port
pnpm dev -- --port 3000
```

### Can't install dependencies
```bash
# Install pnpm first
npm install -g pnpm

# Try again
pnpm install
```

## What to Test

### ✅ Basic Features
- [ ] PDF loads and displays
- [ ] Signature fields appear (blue dashed boxes)
- [ ] Click field opens dialog
- [ ] Draw signature with mouse/trackpad
- [ ] Clear button works
- [ ] Apply signature button works
- [ ] Signature appears in field (green checkmark)

### ✅ Advanced Features
- [ ] Type signature (Type tab)
- [ ] Different font styles
- [ ] Next/Previous signature buttons
- [ ] Zoom in/out controls
- [ ] Page navigation
- [ ] Get InstantJSON output

### ✅ Mobile (if available)
- [ ] Touch drawing works
- [ ] Pinch to zoom
- [ ] Responsive layout

## Next Steps

Once basic testing works:

1. **Read full guide**: `MANUAL_TESTING_GUIDE.md`
2. **Run automated tests**: `pnpm test`
3. **Build for production**: `pnpm build`
4. **Check examples**: `examples/enrollment-ui-integration.tsx`

## Getting Help

- 📖 Full documentation: `README.md`
- 🔍 Testing guide: `MANUAL_TESTING_GUIDE.md`
- 🚀 Quick start: `QUICK_START.md`
- 🏗️ Architecture: `ARCHITECTURE.md`

## Sample PDFs with Signature Fields

- IRS Form W-9: https://www.irs.gov/pub/irs-pdf/fw9.pdf
- IRS Form W-4: https://www.irs.gov/pub/irs-pdf/fw4.pdf
- IRS Form 1040: https://www.irs.gov/pub/irs-pdf/f1040.pdf
