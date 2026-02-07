# E2E Testing Guide

## Overview

Comprehensive end-to-end tests for the PDF signature library using Playwright. Tests cover:

- ✅ Complete signature workflows (drawn & typed)
- ✅ Security validation (SSRF, XSS, injection prevention)
- ✅ Accessibility (WCAG 2.1 AA compliance)
- ✅ Multi-browser compatibility
- ✅ Mobile responsiveness
- ✅ CFR Part 11 compliance verification

## Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### All Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run with UI mode (interactive)
npm run test:e2e:ui
```

### Specific Test Suites

```bash
# Signature workflow tests only
npx playwright test signature-workflow

# Security validation tests only
npx playwright test security-validation

# Accessibility tests only
npx playwright test accessibility
```

For complete documentation, see inline comments in test files.
