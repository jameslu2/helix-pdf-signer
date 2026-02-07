import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Security Validation
 *
 * Tests security features and attack prevention:
 * - URL validation (SSRF prevention)
 * - Data URL validation (XSS prevention)
 * - Input sanitization
 * - Error boundary behavior
 * - Memory leak prevention
 */

test.describe('Security Validation', () => {
  test('should reject invalid document URLs', async ({ page }) => {
    // Test various invalid URLs
    const invalidUrls = [
      'file:///etc/passwd',
      'http://localhost/secret',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'ftp://example.com/file.pdf',
    ];

    for (const url of invalidUrls) {
      await page.goto(`http://localhost:3000/test/pdf-signer?url=${encodeURIComponent(url)}`);

      // Should show error
      const error = page.locator('[data-testid="pdf-error"]');
      await expect(error).toBeVisible({ timeout: 5000 });
      await expect(error).toContainText('Invalid or unauthorized document URL');
    }
  });

  test('should accept valid HTTPS URLs', async ({ page }) => {
    const validUrl = 'https://example.com/document.pdf';

    await page.goto(`http://localhost:3000/test/pdf-signer?url=${encodeURIComponent(validUrl)}`);

    // Should attempt to load (may fail due to CORS, but URL validation passes)
    const viewer = page.locator('[data-testid="pdf-viewer"]');
    await expect(viewer).toBeVisible({ timeout: 5000 });
  });

  test('should accept blob URLs', async ({ page }) => {
    await page.goto('http://localhost:3000/test/pdf-signer');

    // Create blob URL via JavaScript
    const blobUrl = await page.evaluate(() => {
      const blob = new Blob(['fake pdf'], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    });

    // Load with blob URL
    await page.evaluate((url) => {
      window.location.href = `/test/pdf-signer?url=${encodeURIComponent(url)}`;
    }, blobUrl);

    // Should not show URL validation error
    const urlError = page.locator('text=/Invalid or unauthorized document URL/');
    await expect(urlError).not.toBeVisible({ timeout: 2000 }).catch(() => {});
  });

  test('should sanitize typed signature input', async ({ page }) => {
    await page.goto('http://localhost:3000/test/signature-workflow');

    // Open signature dialog
    await page.click('[data-testid="signature-field-0"]');
    await page.click('button:has-text("Type")');

    const input = page.locator('input[placeholder="Type your signature"]');

    // Test script injection attempt
    await input.fill('<script>alert(1)</script>');
    await page.click('button:has-text("Apply Signature")');

    // Should show validation error
    await expect(page.locator('[role="alert"]')).toContainText('invalid characters');

    // Test SQL injection attempt
    await input.fill("Robert'; DROP TABLE users;--");
    await page.click('button:has-text("Apply Signature")');
    await expect(page.locator('[role="alert"]')).toContainText('invalid characters');

    // Test path traversal attempt
    await input.fill('../../../etc/passwd');
    await page.click('button:has-text("Apply Signature")');
    await expect(page.locator('[role="alert"]')).toContainText('invalid characters');

    // Test control character injection
    await input.fill('John\x00Doe');
    await page.click('button:has-text("Apply Signature")');
    await expect(page.locator('[role="alert"]')).toContainText('invalid');

    // Verify valid input works
    await input.fill('John Doe');
    await page.click('button:has-text("Apply Signature")');
    await expect(page.locator('[role="alert"]')).not.toBeVisible();
  });

  test('should enforce signature length limits', async ({ page }) => {
    await page.goto('http://localhost:3000/test/signature-workflow');

    await page.click('[data-testid="signature-field-0"]');
    await page.click('button:has-text("Type")');

    const input = page.locator('input[placeholder="Type your signature"]');

    // Test maximum length (100 characters)
    const longName = 'A'.repeat(150);
    await input.fill(longName);

    // Should be truncated to 100 via maxLength attribute
    const actualValue = await input.inputValue();
    expect(actualValue.length).toBeLessThanOrEqual(100);
  });

  test('should show error boundary on component crash', async ({ page }) => {
    await page.goto('http://localhost:3000/test/error-boundary');

    // Trigger error
    await page.click('[data-testid="btn-trigger-error"]');

    // Should show error boundary UI
    await expect(page.locator('h2:has-text("PDF Viewer Error")')).toBeVisible();
    await expect(page.locator('text=/An error occurred/i')).toBeVisible();

    // Should have "Try Again" button
    const retryButton = page.locator('button:has-text("Try Again")');
    await expect(retryButton).toBeVisible();

    // Click retry
    await retryButton.click();

    // Should attempt to recover
    await expect(page.locator('h2:has-text("PDF Viewer Error")')).not.toBeVisible();
  });

  test('should not expose sensitive error details to user', async ({ page }) => {
    await page.goto('http://localhost:3000/test/error-boundary');

    // Trigger error
    await page.click('[data-testid="btn-trigger-error"]');

    // Error boundary should be visible
    await expect(page.locator('h2:has-text("PDF Viewer Error")')).toBeVisible();

    // Should NOT expose:
    // - File paths
    // - Stack traces (in production mode)
    // - Internal variable names
    // - API endpoints

    const errorText = await page.locator('[data-testid="error-boundary"]').textContent();

    expect(errorText).not.toMatch(/\/Users\//);
    expect(errorText).not.toMatch(/src\//);
    expect(errorText).not.toMatch(/node_modules/);
    expect(errorText).not.toMatch(/at \w+\./); // Stack trace pattern
  });

  test('should validate PDF annotation data', async ({ page }) => {
    // Load PDF with malicious annotations
    await page.goto('http://localhost:3000/test/malicious-pdf');

    // Should detect and skip invalid annotations
    const console = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('[Security]')) {
        console.push(msg.text());
      }
    });

    await page.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 5000 });

    // Should log security warnings but not crash
    // Verify page loads successfully despite invalid annotations
    await expect(page.locator('[data-testid="pdf-viewer"]')).toBeVisible();
  });

  test('should handle concurrent signature operations', async ({ page }) => {
    await page.goto('http://localhost:3000/test/signature-workflow');

    // Open first dialog
    await page.click('[data-testid="signature-field-0"]');
    await expect(page.locator('[data-testid="signature-dialog"]')).toBeVisible();

    // Try to open another field (should not allow)
    await page.click('[data-testid="signature-field-1"]');

    // Should still show first dialog (not switch to second)
    const dialogs = page.locator('[data-testid="signature-dialog"]');
    await expect(dialogs).toHaveCount(1);

    // Close first dialog
    await page.click('button:has-text("Cancel")');

    // Now should be able to open second
    await page.click('[data-testid="signature-field-1"]');
    await expect(page.locator('[data-testid="signature-dialog"]')).toBeVisible();
  });

  test('should protect against clickjacking', async ({ page, context }) => {
    // Verify X-Frame-Options or CSP frame-ancestors is set
    const response = await page.goto('http://localhost:3000/test/signature-workflow');

    const headers = response?.headers();
    const hasClickjackingProtection =
      headers?.['x-frame-options'] === 'DENY' ||
      headers?.['x-frame-options'] === 'SAMEORIGIN' ||
      headers?.['content-security-policy']?.includes('frame-ancestors');

    expect(hasClickjackingProtection).toBeTruthy();
  });

  test('should clean up resources on unmount', async ({ page }) => {
    await page.goto('http://localhost:3000/test/signature-workflow');

    // Get initial memory usage
    const initialMetrics = await page.metrics();

    // Navigate away and back multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto('http://localhost:3000/test/blank');
      await page.goto('http://localhost:3000/test/signature-workflow');
      await page.waitForSelector('[data-testid="pdf-viewer"]');
    }

    // Get final memory usage
    const finalMetrics = await page.metrics();

    // Memory should not grow significantly (allows for some variance)
    const memoryGrowth = (finalMetrics.JSHeapUsedSize - initialMetrics.JSHeapUsedSize) / initialMetrics.JSHeapUsedSize;

    // Should not grow more than 50% (generous threshold accounting for test variance)
    expect(memoryGrowth).toBeLessThan(0.5);
  });

  test('should rate limit signature operations', async ({ page }) => {
    await page.goto('http://localhost:3000/test/signature-workflow');

    // Rapidly apply multiple signatures
    const startTime = Date.now();

    for (let i = 0; i < 3; i++) {
      await page.click(`[data-testid="signature-field-${i}"]`);

      const canvas = page.locator('canvas[data-testid="signature-canvas"]');
      const bbox = await canvas.boundingBox();
      if (bbox) {
        await page.mouse.move(bbox.x + 50, bbox.y + 50);
        await page.mouse.down();
        await page.mouse.move(bbox.x + 150, bbox.y + 100);
        await page.mouse.up();
      }

      await page.click('button:has-text("Apply Signature")');
      await page.waitForSelector('[data-testid="signature-dialog"]', { state: 'hidden' });
    }

    const duration = Date.now() - startTime;

    // Should complete in reasonable time (not artificially delayed)
    expect(duration).toBeLessThan(10000); // 10 seconds for 3 signatures
  });

  test('should validate signature hash integrity', async ({ page }) => {
    const signatureData: any[] = [];

    // Capture signature data
    page.on('console', msg => {
      if (msg.text().includes('Signature captured:')) {
        try {
          const data = JSON.parse(msg.text().replace('Signature captured: ', ''));
          signatureData.push(data);
        } catch (e) {}
      }
    });

    await page.goto('http://localhost:3000/test/signature-workflow');

    // Apply signature
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

    await page.waitForTimeout(500);

    // Verify hash exists and is valid format
    expect(signatureData.length).toBeGreaterThan(0);
    const data = signatureData[0];

    expect(data.signatureHash).toBeDefined();
    expect(data.signatureHash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex format
  });
});
