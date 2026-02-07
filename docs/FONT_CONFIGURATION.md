# Font Configuration for Typed Signatures

## Overview

The typed signature feature supports multiple font styles to provide a handwritten appearance. This document explains font availability, configuration, and best practices.

## Font Strategy

### 1. Generic Cursive (Always Available)
- **Font**: `cursive`
- **Availability**: 100% (CSS generic font family)
- **Appearance**: Browser-dependent cursive font
- **Use Case**: Fallback option, guaranteed to work

### 2. System Fonts (High Availability)
- **Fonts**:
  - `"Brush Script MT"` (Windows, macOS)
  - `"Apple Chancery"` (macOS)
  - `"Lucida Handwriting"` (Windows)
- **Availability**: ~80% (depends on user's OS)
- **Appearance**: High-quality handwritten style
- **Use Case**: Better aesthetics when available

### 3. Web Fonts (Optional, Requires Configuration)
- **Fonts**:
  - `"Dancing Script"` (Google Fonts)
  - `"Great Vibes"` (Google Fonts)
- **Availability**: 100% when configured
- **Appearance**: Consistent across all platforms
- **Use Case**: Professional, consistent branding

---

## Configuration Options

### Option A: Google Fonts CDN (Recommended for Production)

Add to your HTML `<head>`:

```html
<!-- Preconnect to Google Fonts for faster loading -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Load signature fonts -->
<link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&display=swap" rel="stylesheet">
```

**Pros:**
- Fast loading (Google CDN)
- Reliable availability
- Automatic browser caching
- No build step changes

**Cons:**
- External dependency (Google Fonts CDN)
- Privacy considerations (Google sees requests)
- Requires internet connection

---

### Option B: Self-Hosted Fonts (Best for Privacy)

1. Download fonts from [Google Fonts](https://fonts.google.com/)
2. Add to your project:

```
public/
  fonts/
    DancingScript-Regular.woff2
    GreatVibes-Regular.woff2
```

3. Add CSS `@font-face` declarations:

```css
@font-face {
  font-family: 'Dancing Script';
  src: url('/fonts/DancingScript-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: 'Great Vibes';
  src: url('/fonts/GreatVibes-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
```

**Pros:**
- No external dependencies
- Better privacy (GDPR-compliant)
- Works offline
- Full control over font versions

**Cons:**
- Larger bundle size
- Manual updates
- Need to handle browser caching

---

### Option C: System Fonts Only (No Configuration)

Do nothing! The library falls back to system fonts:

```typescript
// Font stack automatically includes system fallbacks:
"Dancing Script", "Brush Script MT", "Apple Chancery", cursive
```

**Pros:**
- Zero configuration
- No external requests
- Fastest loading
- No privacy concerns

**Cons:**
- Inconsistent appearance across platforms
- May fall back to generic cursive
- Less professional appearance

---

## Font Customization

### Adding Custom Fonts

Edit `src/components/SignatureCapture/SignatureTyped.tsx`:

```typescript
const SIGNATURE_FONTS = [
  {
    name: 'Your Custom Font',
    value: '"Your Font Name", "Fallback Font", cursive',
    description: 'Description for tooltip',
    webFontUrl: 'https://fonts.googleapis.com/css2?family=Your+Font&display=swap',
  },
  // ... other fonts
];
```

### Font Stack Best Practices

1. **Primary Font**: Your preferred font (may not be available)
2. **System Fallback**: Similar system font
3. **Generic Fallback**: Always end with `cursive` or `serif`

Example:
```css
font-family: "Dancing Script", "Brush Script MT", "Apple Chancery", cursive;
```

---

## Performance Considerations

### Font Loading Strategy

1. **Preload Critical Fonts** (optional):
```html
<link rel="preload" href="/fonts/DancingScript-Regular.woff2" as="font" type="font/woff2" crossorigin>
```

2. **Use `font-display: swap`**:
```css
@font-face {
  font-family: 'Dancing Script';
  src: url('/fonts/DancingScript-Regular.woff2') format('woff2');
  font-display: swap; /* Show fallback immediately, swap when loaded */
}
```

3. **Subset Fonts** (reduce file size):
```
// Include only Latin characters
?family=Dancing+Script&subset=latin
```

### Font Loading Detection

The component automatically detects font loading:

```typescript
useEffect(() => {
  document.fonts.ready.then(() => {
    setFontsLoaded(true);
  });
}, []);
```

Shows "Loading fonts..." until ready.

---

## Troubleshooting

### Fonts Not Appearing

1. **Check Console**: Look for 404 errors for font files
2. **Check Network Tab**: Verify font requests succeed
3. **Check CORS**: Self-hosted fonts need proper CORS headers
4. **Check Font Format**: Use `.woff2` for best compatibility

### Font Flash (FOUT/FOIT)

If you see text flash when font loads:

1. Use `font-display: swap` in `@font-face`
2. Preload critical fonts
3. Consider using system fonts only

### Inconsistent Appearance

If signatures look different across devices:

1. Use web fonts (Google Fonts or self-hosted)
2. Test on Windows, macOS, iOS, Android
3. Verify font fallback chain

---

## Licensing

### Google Fonts
- **License**: Open Font License (OFL)
- **Commercial Use**: ✅ Yes
- **Attribution**: Not required (but appreciated)
- **Self-hosting**: ✅ Allowed

### System Fonts
- **License**: Varies by OS
- **Commercial Use**: ✅ Yes (included with OS)
- **Redistribution**: ❌ Not allowed

---

## Accessibility

### Font Size
- Minimum: 48px (for canvas rendering)
- Adjustable via component props

### Screen Readers
- Font buttons include `aria-label` with descriptions
- Preview shows typed signature in real-time

### Color Contrast
- Black text on white background (WCAG AAA compliant)

---

## Examples

### enrollment-ui Integration

```typescript
// Option 1: Use Google Fonts (add to HTML <head>)
<link href="https://fonts.googleapis.com/css2?family=Dancing+Script&display=swap" rel="stylesheet">

// Option 2: No configuration (system fonts only)
<PDFSigner
  documentUrl={url}
  // Fonts work automatically
/>
```

### Next.js Integration

```tsx
// app/layout.tsx
import { Dancing_Script, Great_Vibes } from 'next/font/google';

const dancingScript = Dancing_Script({ subsets: ['latin'] });
const greatVibes = Great_Vibes({ weight: '400', subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <style jsx global>{`
          ${dancingScript.style}
          ${greatVibes.style}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## Recommendations

### For Production (enrollment-ui)
- ✅ Use Google Fonts CDN (fast, reliable)
- ✅ Include `<link>` in HTML `<head>`
- ✅ Use `font-display: swap`
- ✅ Test on multiple devices

### For Privacy-Focused Applications
- ✅ Self-host fonts
- ✅ No external requests
- ✅ Include WOFF2 format only

### For Maximum Compatibility
- ✅ Rely on system fonts
- ✅ Zero configuration
- ✅ Fast loading

---

## Support

For font-related issues:
1. Check browser console for errors
2. Verify font files are accessible
3. Test with system fonts first
4. Open issue on GitHub with screenshots
