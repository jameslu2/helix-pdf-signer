import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateDocumentUrl, documentUrlConfig } from '../../src/utils/pdf-utils';

/**
 * SECURITY TEST: Document URL Validation (CRIT-2)
 *
 * Tests that document URLs are properly validated to prevent:
 * - SSRF (Server-Side Request Forgery) attacks
 * - File system access via file:// protocol
 * - Internal network scanning via http://localhost
 * - DNS rebinding attacks
 * - Malicious protocol handlers
 *
 * CWE-918: Server-Side Request Forgery (SSRF)
 * CWE-73: External Control of File Name or Path
 */

describe('validateDocumentUrl - SSRF Prevention', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Reset to production mode for most tests
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('Allowed Protocols', () => {
    it('should allow HTTPS URLs', () => {
      expect(validateDocumentUrl('https://example.com/document.pdf')).toBe(true);
    });

    it('should allow blob URLs', () => {
      expect(validateDocumentUrl('blob:https://example.com/abc-123')).toBe(true);
    });

    it('should allow data URLs for PDFs', () => {
      expect(validateDocumentUrl('data:application/pdf;base64,JVBERi0xLjQK')).toBe(true);
    });

    it('should reject HTTP URLs in production', () => {
      expect(validateDocumentUrl('http://example.com/document.pdf')).toBe(false);
    });

    it('should reject file:// protocol', () => {
      expect(validateDocumentUrl('file:///etc/passwd')).toBe(false);
      expect(validateDocumentUrl('file:///C:/Windows/System32/config/SAM')).toBe(false);
    });

    it('should reject ftp:// protocol', () => {
      expect(validateDocumentUrl('ftp://example.com/document.pdf')).toBe(false);
    });

    it('should reject javascript: protocol', () => {
      expect(validateDocumentUrl('javascript:alert(1)')).toBe(false);
    });

    it('should reject data: protocol', () => {
      expect(validateDocumentUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    });
  });

  describe('Domain Whitelisting', () => {
    it('should allow whitelisted domains', () => {
      // Add test domain to whitelist
      documentUrlConfig.allowedDomains.push('trusted.example.com');

      expect(validateDocumentUrl('https://trusted.example.com/doc.pdf')).toBe(true);

      // Cleanup
      documentUrlConfig.allowedDomains.pop();
    });

    it('should reject non-whitelisted domains', () => {
      expect(validateDocumentUrl('https://evil.com/document.pdf')).toBe(false);
    });

    it('should reject subdomain bypass attempts', () => {
      documentUrlConfig.allowedDomains.push('example.com');

      // Should NOT allow evil.com with example.com as subdomain
      expect(validateDocumentUrl('https://example.com.evil.com/doc.pdf')).toBe(false);

      documentUrlConfig.allowedDomains.pop();
    });
  });

  describe('SSRF Attack Prevention', () => {
    it('should reject localhost URLs', () => {
      expect(validateDocumentUrl('https://localhost/document.pdf')).toBe(false);
      expect(validateDocumentUrl('https://127.0.0.1/document.pdf')).toBe(false);
    });

    it('should reject internal IP addresses', () => {
      expect(validateDocumentUrl('https://192.168.1.1/document.pdf')).toBe(false);
      expect(validateDocumentUrl('https://10.0.0.1/document.pdf')).toBe(false);
      expect(validateDocumentUrl('https://172.16.0.1/document.pdf')).toBe(false);
    });

    it('should reject IPv6 localhost', () => {
      expect(validateDocumentUrl('https://[::1]/document.pdf')).toBe(false);
      expect(validateDocumentUrl('https://[0:0:0:0:0:0:0:1]/document.pdf')).toBe(false);
    });

    it('should reject cloud metadata endpoints', () => {
      // AWS metadata endpoint
      expect(validateDocumentUrl('https://169.254.169.254/latest/meta-data/')).toBe(false);
      // Google Cloud metadata endpoint
      expect(validateDocumentUrl('https://metadata.google.internal/computeMetadata/v1/')).toBe(false);
    });
  });

  describe('URL Encoding Bypass Prevention', () => {
    it('should reject URL-encoded file protocol', () => {
      expect(validateDocumentUrl('file%3A%2F%2F%2Fetc%2Fpasswd')).toBe(false);
    });

    it('should reject URL-encoded localhost', () => {
      expect(validateDocumentUrl('https://%6C%6F%63%61%6C%68%6F%73%74/doc.pdf')).toBe(false);
    });

    it('should reject unicode/homograph attacks', () => {
      // Cyrillic 'а' (U+0430) instead of Latin 'a'
      expect(validateDocumentUrl('https://exаmple.com/doc.pdf')).toBe(false);
    });
  });

  describe('Size Limits', () => {
    it('should reject URLs exceeding max length', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(10000);
      expect(validateDocumentUrl(longUrl)).toBe(false);
    });

    it('should reject data URLs exceeding max size', () => {
      const largeDataUrl = 'data:application/pdf;base64,' + 'A'.repeat(20 * 1024 * 1024);
      expect(validateDocumentUrl(largeDataUrl)).toBe(false);
    });
  });

  describe('Malformed URL Handling', () => {
    it('should reject empty strings', () => {
      expect(validateDocumentUrl('')).toBe(false);
    });

    it('should reject non-string input', () => {
      expect(validateDocumentUrl(null as any)).toBe(false);
      expect(validateDocumentUrl(undefined as any)).toBe(false);
      expect(validateDocumentUrl(123 as any)).toBe(false);
      expect(validateDocumentUrl({} as any)).toBe(false);
    });

    it('should reject URLs with invalid characters', () => {
      expect(validateDocumentUrl('https://example.com/<script>')).toBe(false);
      expect(validateDocumentUrl('https://example.com/\x00null')).toBe(false);
    });

    it('should reject URLs without protocol', () => {
      expect(validateDocumentUrl('example.com/document.pdf')).toBe(false);
      expect(validateDocumentUrl('//example.com/document.pdf')).toBe(false);
    });
  });

  describe('Development Mode', () => {
    it('should allow localhost in development mode', () => {
      process.env.NODE_ENV = 'development';

      expect(validateDocumentUrl('http://localhost:3000/document.pdf')).toBe(true);
      expect(validateDocumentUrl('http://127.0.0.1:3000/document.pdf')).toBe(true);
    });

    it('should still reject file:// in development mode', () => {
      process.env.NODE_ENV = 'development';

      expect(validateDocumentUrl('file:///etc/passwd')).toBe(false);
    });
  });

  describe('Data URL Validation', () => {
    it('should only allow PDF data URLs', () => {
      expect(validateDocumentUrl('data:application/pdf;base64,JVBERi0=')).toBe(true);
      expect(validateDocumentUrl('data:image/png;base64,iVBORw0=')).toBe(false);
      expect(validateDocumentUrl('data:text/html;base64,PHNjcmlwdD4=')).toBe(false);
    });

    it('should reject non-base64 data URLs', () => {
      expect(validateDocumentUrl('data:application/pdf,not-base64')).toBe(false);
    });

    it('should validate base64 format', () => {
      expect(validateDocumentUrl('data:application/pdf;base64,!!!invalid!!!')).toBe(false);
    });
  });
});
