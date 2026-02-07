import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Complete Signature Workflow
 *
 * Tests the end-to-end signature capture and application process:
 * - PDF loading and rendering
 * - Signature field detection and highlighting
 * - Signature capture (drawn and typed)
 * - Signature application and persistence
 * - Multi-field workflows
 * - CFR Part 11 metadata capture
 */

test.describe('Signature Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test page with PDF signer
    await page.goto('http://localhost:3000/test/signature-workflow');

    // Wait for PDF to load
    await page.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 10000 });
  });

  test('should load PDF document and detect signature fields', async ({ page }) => {
    // Verify PDF renders
    const pdfViewer = page.locator('[data-testid="pdf-viewer"]');
    await expect(pdfViewer).toBeVisible();

    // Verify signature fields are detected and highlighted
    const signatureFields = page.locator('[data-testid^="signature-field-"]');
    await expect(signatureFields.first()).toBeVisible();

    // Check field count
    const fieldCount = await signatureFields.count();
    expect(fieldCount).toBeGreaterThan(0);

    // Verify field indicators show unsigned status
    const firstField = signatureFields.first();
    await expect(firstField).toHaveAttribute('data-signed', 'false');
  });

  test('should open signature dialog when clicking field', async ({ page }) => {
    // Click first signature field
    await page.click('[data-testid="signature-field-0"]');

    // Verify dialog opens
    const dialog = page.locator('[data-testid="signature-dialog"]');
    await expect(dialog).toBeVisible();

    // Verify dialog title
    await expect(dialog.locator('h2')).toContainText('Sign Here');

    // Verify tabs are present
    await expect(dialog.locator('button:has-text("Draw")')).toBeVisible();
    await expect(dialog.locator('button:has-text("Type")')).toBeVisible();
  });

  test('should capture drawn signature', async ({ page }) => {
    // Open signature dialog
    await page.click('[data-testid="signature-field-0"]');

    // Wait for canvas to be ready
    const canvas = page.locator('canvas[data-testid="signature-canvas"]');
    await expect(canvas).toBeVisible();

    // Draw signature (simulate mouse drag)
    const bbox = await canvas.boundingBox();
    if (!bbox) throw new Error('Canvas not found');

    await page.mouse.move(bbox.x + 50, bbox.y + 50);
    await page.mouse.down();
    await page.mouse.move(bbox.x + 200, bbox.y + 100, { steps: 10 });
    await page.mouse.move(bbox.x + 150, bbox.y + 150, { steps: 10 });
    await page.mouse.up();

    // Verify "Apply Signature" button is enabled
    const applyButton = page.locator('button:has-text("Apply Signature")');
    await expect(applyButton).toBeEnabled();

    // Apply signature
    await applyButton.click();

    // Verify dialog closes
    await expect(page.locator('[data-testid="signature-dialog"]')).not.toBeVisible();

    // Verify field is marked as signed
    const signedField = page.locator('[data-testid="signature-field-0"]');
    await expect(signedField).toHaveAttribute('data-signed', 'true');
  });

  test('should capture typed signature', async ({ page }) => {
    // Open signature dialog
    await page.click('[data-testid="signature-field-0"]');

    // Switch to Type tab
    await page.click('button:has-text("Type")');

    // Type signature
    const input = page.locator('input[placeholder="Type your signature"]');
    await expect(input).toBeVisible();
    await input.fill('John Doe');

    // Verify preview updates
    const preview = page.locator('[data-testid="signature-preview"]');
    await expect(preview).toContainText('John Doe');

    // Select font
    await page.click('[data-testid="font-dancing-script"]');

    // Apply signature
    await page.click('button:has-text("Apply Signature")');

    // Verify field is marked as signed
    await expect(page.locator('[data-testid="signature-field-0"]')).toHaveAttribute('data-signed', 'true');
  });

  test('should validate typed signature input', async ({ page }) => {
    // Open signature dialog and switch to Type
    await page.click('[data-testid="signature-field-0"]');
    await page.click('button:has-text("Type")');

    const input = page.locator('input[placeholder="Type your signature"]');

    // Test 1: Too short (< 2 characters)
    await input.fill('A');
    await page.click('button:has-text("Apply Signature")');
    await expect(page.locator('[role="alert"]')).toContainText('at least 2 characters');

    // Test 2: Invalid characters (numbers)
    await input.fill('John123');
    await page.click('button:has-text("Apply Signature")');
    await expect(page.locator('[role="alert"]')).toContainText('invalid characters');

    // Test 3: Too long (> 100 characters)
    await input.fill('A'.repeat(101));
    await expect(input).toHaveValue('A'.repeat(100)); // Truncated by maxLength

    // Test 4: Valid input
    await input.fill('John Doe');
    await page.click('button:has-text("Apply Signature")');
    await expect(page.locator('[role="alert"]')).not.toBeVisible();
  });

  test('should handle multiple signature fields', async ({ page }) => {
    // Get all signature fields
    const fields = page.locator('[data-testid^="signature-field-"]');
    const fieldCount = await fields.count();

    // Sign each field
    for (let i = 0; i < fieldCount; i++) {
      // Click field
      await fields.nth(i).click();

      // Draw quick signature
      const canvas = page.locator('canvas[data-testid="signature-canvas"]');
      const bbox = await canvas.boundingBox();
      if (bbox) {
        await page.mouse.move(bbox.x + 50, bbox.y + 50);
        await page.mouse.down();
        await page.mouse.move(bbox.x + 150, bbox.y + 100);
        await page.mouse.up();
      }

      // Apply
      await page.click('button:has-text("Apply Signature")');

      // Wait for dialog to close
      await page.waitForSelector('[data-testid="signature-dialog"]', { state: 'hidden' });
    }

    // Verify all fields are signed
    for (let i = 0; i < fieldCount; i++) {
      await expect(fields.nth(i)).toHaveAttribute('data-signed', 'true');
    }

    // Verify completion status
    await expect(page.locator('[data-testid="signature-status"]')).toContainText('All fields signed');
  });

  test('should support "Next Signature" navigation', async ({ page }) => {
    // Click "Next Signature" button
    await page.click('[data-testid="btn-next-signature"]');

    // Verify dialog opens for first unsigned field
    await expect(page.locator('[data-testid="signature-dialog"]')).toBeVisible();

    // Close dialog
    await page.click('button:has-text("Cancel")');

    // Sign first field
    await page.click('[data-testid="signature-field-0"]');
    const canvas = page.locator('canvas[data-testid="signature-canvas"]');
    const bbox = await canvas.boundingBox();
    if (bbox) {
      await page.mouse.move(bbox.x + 50, bbox.y + 50);
      await page.mouse.down();
      await page.mouse.move(bbox.x + 150, bbox.y + 100);
      await page.mouse.up();
    }
    await page.click('button:has-text("Apply Signature")');

    // Click "Next Signature" again
    await page.click('[data-testid="btn-next-signature"]');

    // Verify navigates to next unsigned field
    await expect(page.locator('[data-testid="signature-dialog"]')).toBeVisible();
  });

  test('should clear signature and restart', async ({ page }) => {
    // Open dialog and start drawing
    await page.click('[data-testid="signature-field-0"]');

    const canvas = page.locator('canvas[data-testid="signature-canvas"]');
    const bbox = await canvas.boundingBox();
    if (bbox) {
      await page.mouse.move(bbox.x + 50, bbox.y + 50);
      await page.mouse.down();
      await page.mouse.move(bbox.x + 150, bbox.y + 100);
      await page.mouse.up();
    }

    // Verify "Clear" button is enabled
    const clearButton = page.locator('button:has-text("Clear")');
    await expect(clearButton).toBeEnabled();

    // Click Clear
    await clearButton.click();

    // Verify "Apply Signature" button is disabled again
    await expect(page.locator('button:has-text("Apply Signature")')).toBeDisabled();

    // Draw again
    if (bbox) {
      await page.mouse.move(bbox.x + 60, bbox.y + 60);
      await page.mouse.down();
      await page.mouse.move(bbox.x + 160, bbox.y + 110);
      await page.mouse.up();
    }

    // Apply
    await page.click('button:has-text("Apply Signature")');

    // Verify field is signed
    await expect(page.locator('[data-testid="signature-field-0"]')).toHaveAttribute('data-signed', 'true');
  });

  test('should capture CFR Part 11 metadata', async ({ page }) => {
    // Enable console logging to capture signature data
    const signatureData: any[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Signature captured:')) {
        try {
          const data = JSON.parse(msg.text().replace('Signature captured: ', ''));
          signatureData.push(data);
        } catch (e) {
          // Ignore parse errors
        }
      }
    });

    // Sign a field
    await page.click('[data-testid="signature-field-0"]');
    const canvas = page.locator('canvas[data-testid="signature-canvas"]');
    const bbox = await canvas.boundingBox();
    if (bbox) {
      await page.mouse.move(bbox.x + 50, bbox.y + 50);
      await page.mouse.down();
      await page.mouse.move(bbox.x + 150, bbox.y + 100);
      await page.mouse.up();
    }
    await page.click('button:has-text("Apply Signature")');

    // Wait for console log
    await page.waitForTimeout(500);

    // Verify CFR Part 11 metadata is captured
    expect(signatureData.length).toBeGreaterThan(0);
    const data = signatureData[0];

    expect(data).toHaveProperty('signerName');
    expect(data).toHaveProperty('signerId');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('signatureHash');
    expect(data).toHaveProperty('documentHash');
    expect(data).toHaveProperty('sessionId');
    expect(data).toHaveProperty('signatureVersion');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus first signature field
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Open with Enter
    await page.keyboard.press('Enter');

    // Verify dialog opens
    await expect(page.locator('[data-testid="signature-dialog"]')).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');

    // Verify dialog closes
    await expect(page.locator('[data-testid="signature-dialog"]')).not.toBeVisible();
  });

  test('should maintain signature across page navigation', async ({ page }) => {
    // Sign first field on page 1
    await page.click('[data-testid="signature-field-0"]');
    const canvas = page.locator('canvas[data-testid="signature-canvas"]');
    const bbox = await canvas.boundingBox();
    if (bbox) {
      await page.mouse.move(bbox.x + 50, bbox.y + 50);
      await page.mouse.down();
      await page.mouse.move(bbox.x + 150, bbox.y + 100);
      await page.mouse.up();
    }
    await page.click('button:has-text("Apply Signature")');

    // Navigate to page 2
    await page.click('[data-testid="btn-next-page"]');

    // Navigate back to page 1
    await page.click('[data-testid="btn-prev-page"]');

    // Verify signature is still there
    await expect(page.locator('[data-testid="signature-field-0"]')).toHaveAttribute('data-signed', 'true');
  });
});
