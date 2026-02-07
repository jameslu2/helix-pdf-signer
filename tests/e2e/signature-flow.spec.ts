import { test, expect } from '@playwright/test';

test.describe('Signature Flow', () => {
  test('completes full signature workflow', async ({ page }) => {
    await page.goto('/');

    // Wait for PDF to load
    await page.waitForSelector('[data-testid="pdf-viewer"]');

    // Click first signature field
    await page.click('[data-testid="signature-field-sig-1-0"]');

    // Wait for dialog to open
    await expect(page.locator('.signature-dialog')).toBeVisible();

    // Draw signature on canvas
    const canvas = page.locator('canvas[class="signature-canvas"]');
    await canvas.hover({ position: { x: 50, y: 50 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 100 } });
    await page.mouse.up();

    // Apply signature
    await page.click('button:has-text("Apply Signature")');

    // Wait for dialog to close
    await expect(page.locator('.signature-dialog')).not.toBeVisible();

    // Verify field is marked as signed
    const signedField = page.locator('[data-testid="signature-field-sig-1-0"]');
    await expect(signedField).toHaveAttribute('data-signed', 'true');
  });

  test('supports typed signature', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('[data-testid="pdf-viewer"]');
    await page.click('[data-testid="signature-field-sig-1-0"]');

    // Switch to Type tab
    await page.click('button:has-text("Type")');

    // Type signature
    await page.fill('input[placeholder="Type your signature"]', 'John Doe');

    // Apply signature
    await page.click('button:has-text("Apply Signature")');

    // Verify signed
    const signedField = page.locator('[data-testid="signature-field-sig-1-0"]');
    await expect(signedField).toHaveAttribute('data-signed', 'true');
  });

  test('navigates between signature fields', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('[data-testid="pdf-viewer"]');

    // Click next signature button
    await page.click('button:has-text("Next Signature")');

    // Verify dialog opens for next field
    await expect(page.locator('.signature-dialog')).toBeVisible();
  });

  test('clears signature canvas', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('[data-testid="pdf-viewer"]');
    await page.click('[data-testid="signature-field-sig-1-0"]');

    // Draw something
    const canvas = page.locator('canvas[class="signature-canvas"]');
    await canvas.hover({ position: { x: 50, y: 50 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.up();

    // Clear button should be enabled
    const clearButton = page.locator('button:has-text("Clear")');
    await expect(clearButton).not.toBeDisabled();

    // Click clear
    await clearButton.click();

    // Apply button should be disabled again
    const applyButton = page.locator('button:has-text("Apply Signature")');
    await expect(applyButton).toBeDisabled();
  });

  test('handles zoom controls', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('[data-testid="pdf-viewer"]');

    // Get initial zoom level
    const zoomText = page.locator('.pdf-toolbar-text:has-text("%")');
    const initialZoom = await zoomText.textContent();

    // Zoom in
    await page.click('button[aria-label="Zoom in"]');

    // Verify zoom increased
    const newZoom = await zoomText.textContent();
    expect(newZoom).not.toBe(initialZoom);
  });

  test('supports keyboard navigation', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('[data-testid="pdf-viewer"]');

    // Focus first signature field
    const field = page.locator('[data-testid="signature-field-sig-1-0"]');
    await field.focus();

    // Press Enter to open dialog
    await page.keyboard.press('Enter');

    // Verify dialog opens
    await expect(page.locator('.signature-dialog')).toBeVisible();
  });
});
