# Command Reference

Quick reference for all available commands.

## Installation

```bash
# Install dependencies
pnpm install

# Or with npm
npm install

# Or with yarn
yarn install
```

## Development

```bash
# Start development server (http://localhost:5173)
pnpm dev

# Start on different port
pnpm dev -- --port 3000

# Start with host exposed (for testing on mobile)
pnpm dev -- --host
```

## Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run tests with coverage
pnpm test -- --coverage

# Run E2E tests
pnpm test:e2e

# Run E2E tests in headed mode (see browser)
pnpm test:e2e -- --headed

# Run E2E tests in specific browser
pnpm test:e2e -- --project=chromium
pnpm test:e2e -- --project=firefox
pnpm test:e2e -- --project=webkit
```

## Building

```bash
# Build for production
pnpm build

# Build and watch for changes
pnpm build -- --watch

# Type check without building
pnpm typecheck
```

## Linting

```bash
# Run ESLint
pnpm lint

# Fix ESLint errors automatically
pnpm lint -- --fix
```

## Publishing

```bash
# Build and publish to npm (public)
pnpm build
pnpm publish --access public

# Dry run (see what would be published)
pnpm publish --dry-run

# Publish with specific tag
pnpm publish --tag beta
```

## Manual Testing

```bash
# Quick test (starts dev server)
pnpm dev

# Then open http://localhost:5173 in browser

# Download sample PDF with signature fields
curl -o public/sample-document.pdf "https://www.irs.gov/pub/irs-pdf/fw9.pdf"
```

## Linking for Local Development

```bash
# In helix-pdf-signer directory
pnpm link

# In your test project
pnpm link @helix/pdf-signer

# Unlink when done
pnpm unlink @helix/pdf-signer
```

## Cleaning

```bash
# Remove node_modules
rm -rf node_modules

# Remove build output
rm -rf dist

# Remove all generated files
rm -rf node_modules dist coverage playwright-report test-results

# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Git Operations

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add remote
git remote add origin https://github.com/your-org/pdf-signer.git

# Push
git push -u origin main
```

## Debugging

```bash
# Run with verbose logging
DEBUG=* pnpm dev

# Check bundle size
pnpm build
ls -lh dist/

# Analyze bundle
pnpm vite-bundle-visualizer
```

## Quick Workflows

### Test Workflow
```bash
# 1. Install
pnpm install

# 2. Download sample PDF
curl -o public/sample-document.pdf "https://www.irs.gov/pub/irs-pdf/fw9.pdf"

# 3. Start dev server
pnpm dev

# 4. Open http://localhost:5173
# 5. Click "Load PDF" and test
```

### Build & Publish Workflow
```bash
# 1. Update version in package.json
# 2. Update CHANGELOG.md
# 3. Run tests
pnpm test

# 4. Build
pnpm build

# 5. Test built version
ls -la dist/

# 6. Publish
pnpm publish --access public

# 7. Tag release
git tag v1.0.0
git push origin v1.0.0
```

### Integration Test Workflow
```bash
# 1. Build library
pnpm build

# 2. Link locally
pnpm link

# 3. In test project
cd ../test-project
pnpm link @helix/pdf-signer

# 4. Use in test project
import { PDFSigner } from '@helix/pdf-signer';

# 5. Unlink when done
pnpm unlink @helix/pdf-signer
```

## Environment Variables

```bash
# Set Node environment
NODE_ENV=production pnpm build

# Set port
PORT=3000 pnpm dev

# Enable debug mode
DEBUG=* pnpm dev
```

## Common Issues

### Port already in use
```bash
# Find process using port 5173
lsof -ti:5173

# Kill process
kill -9 $(lsof -ti:5173)

# Or use different port
pnpm dev -- --port 3000
```

### Module not found
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript errors
```bash
# Check types
pnpm typecheck

# Clear TypeScript cache
rm -rf node_modules/.cache
```

### Build errors
```bash
# Clean and rebuild
rm -rf dist
pnpm build
```

## Performance Testing

```bash
# Build and check size
pnpm build
ls -lh dist/

# Measure gzip size
gzip -c dist/index.mjs | wc -c

# Run performance tests
pnpm test:perf
```

## Documentation

```bash
# Generate API documentation (if configured)
pnpm docs

# Serve documentation locally
pnpm docs:serve
```

## Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
alias pdfs='cd helix-pdf-signer'
alias pdft='pnpm test'
alias pdfd='pnpm dev'
alias pdfb='pnpm build'
```

## VS Code Tasks

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Dev Server",
      "type": "shell",
      "command": "pnpm dev",
      "group": "build"
    },
    {
      "label": "Run Tests",
      "type": "shell",
      "command": "pnpm test",
      "group": "test"
    },
    {
      "label": "Build",
      "type": "shell",
      "command": "pnpm build",
      "group": "build"
    }
  ]
}
```
