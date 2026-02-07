# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-02-07

### Added
- Initial release
- PDF viewing with PDF.js integration
- Signature field detection from PDF annotations
- Canvas-based signature drawing with signature_pad
- Typed signature support with multiple font styles
- PSPDFKit InstantJSON output format
- Zoom and navigation controls
- Mobile touch support
- Keyboard navigation and accessibility features
- CFR Part 11 compliance metadata capture
- Drop-in replacement API compatible with Nutrient SDK
- Comprehensive TypeScript types
- Unit and E2E test suite
- Migration guide from Nutrient SDK
- Example integration for enrollment-ui

### Features
- ✅ Multi-page PDF rendering
- ✅ Signature field overlay with visual indicators
- ✅ Draw and type signature modes
- ✅ Signature preview before applying
- ✅ Toolbar with zoom and page navigation
- ✅ Responsive design for mobile and desktop
- ✅ Ref methods for imperative control
- ✅ Event callbacks for signature status
- ✅ Error handling and loading states
- ✅ Lightweight bundle (<100KB gzipped)

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Chrome Android 90+

## [Unreleased]

### Planned Features
- [ ] Image upload signature option
- [ ] Signature annotation editing/deletion
- [ ] Multi-user signature support
- [ ] Signature templates
- [ ] Custom signature field styling
- [ ] Signature history tracking
- [ ] Offline signature support
- [ ] PDF form field support beyond signatures
- [ ] Document comparison/diff view
- [ ] Advanced zoom controls (fit to page, fit to width)
- [ ] Page thumbnails sidebar
- [ ] Search within PDF
- [ ] Print support
- [ ] Export signed PDF
