import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateSignatureHash,
  createCFRCompliantSignature,
  generateSignatureId,
  validateImageDataUrl,
} from '../../src/utils/signature-utils';

/**
 * SECURITY TEST: CFR Part 11 Compliance (CRIT-5)
 *
 * Tests that signature data includes all required CFR Part 11 fields:
 * - 21 CFR 11.50(a): Signature manifestations (name, date, meaning)
 * - 21 CFR 11.70: Signature/record linking (hash integrity)
 * - 21 CFR 11.100: User identification and authentication
 *
 * Also tests:
 * - CRIT-6: Cryptographically secure signature IDs
 * - CRIT-3: Data URL validation
 */

describe('CFR Part 11 Signature Compliance', () => {
  describe('generateSignatureHash - Integrity', () => {
    it('should generate consistent SHA-256 hash for same input', async () => {
      const signatureData = {
        type: 'drawn' as const,
        data: 'data:image/png;base64,abc123',
        timestamp: '2024-01-01T00:00:00.000Z',
        signerName: 'John Doe',
        signerId: 'user-123',
        signerIntent: 'I approve this document',
        documentHash: 'doc-hash-123',
      };

      const hash1 = await generateSignatureHash(signatureData);
      const hash2 = await generateSignatureHash(signatureData);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex format
    });

    it('should generate different hashes for different data', async () => {
      const signatureData1 = {
        type: 'drawn' as const,
        data: 'data:image/png;base64,abc123',
        timestamp: '2024-01-01T00:00:00.000Z',
        signerName: 'John Doe',
        signerId: 'user-123',
        signerIntent: 'I approve this document',
        documentHash: 'doc-hash-123',
      };

      const signatureData2 = {
        ...signatureData1,
        signerName: 'Jane Smith', // Changed field
      };

      const hash1 = await generateSignatureHash(signatureData1);
      const hash2 = await generateSignatureHash(signatureData2);

      expect(hash1).not.toBe(hash2);
    });

    it('should include all critical fields in hash', async () => {
      const signatureData = {
        type: 'drawn' as const,
        data: 'data:image/png;base64,abc123',
        timestamp: '2024-01-01T00:00:00.000Z',
        signerName: 'John Doe',
        signerId: 'user-123',
        signerIntent: 'I approve this document',
        documentHash: 'doc-hash-123',
      };

      const originalHash = await generateSignatureHash(signatureData);

      // Changing any field should change the hash
      const testFields: Array<keyof typeof signatureData> = [
        'type',
        'data',
        'timestamp',
        'signerName',
        'signerId',
        'signerIntent',
        'documentHash',
      ];

      for (const field of testFields) {
        const modifiedData = { ...signatureData };
        if (field === 'type') {
          (modifiedData as any)[field] = 'typed';
        } else {
          (modifiedData as any)[field] = 'modified-value';
        }

        const modifiedHash = await generateSignatureHash(modifiedData);
        expect(modifiedHash).not.toBe(originalHash);
      }
    });
  });

  describe('createCFRCompliantSignature - Required Fields', () => {
    const validContext = {
      signerName: 'John Doe',
      signerId: 'user-123',
      sessionId: 'session-abc',
      documentHash: 'doc-hash-xyz',
      authMethod: 'okta_2fa',
      ipAddress: '203.0.113.42',
    };

    it('should include all CFR Part 11.50(a) required fields', async () => {
      const signature = await createCFRCompliantSignature(
        { type: 'drawn', data: 'data:image/png;base64,abc123' },
        validContext,
        'I approve this document'
      );

      // 11.50(a)(1): Printed name of the signer
      expect(signature.signerName).toBe('John Doe');

      // 11.50(a)(2): Date and time when signature was executed
      expect(signature.timestamp).toBeDefined();
      expect(new Date(signature.timestamp).getTime()).toBeGreaterThan(0);

      // 11.50(a)(3): Meaning associated with the signature
      expect(signature.signerIntent).toBe('I approve this document');
    });

    it('should include all CFR Part 11.100 required fields', async () => {
      const signature = await createCFRCompliantSignature(
        { type: 'drawn', data: 'data:image/png;base64,abc123' },
        validContext
      );

      // 11.100: Identification codes and passwords
      expect(signature.signerId).toBe('user-123');
      expect(signature.authMethod).toBe('okta_2fa');
    });

    it('should include all CFR Part 11.70 required fields', async () => {
      const signature = await createCFRCompliantSignature(
        { type: 'drawn', data: 'data:image/png;base64,abc123' },
        validContext
      );

      // 11.70: Electronic signatures and records linking
      expect(signature.signatureHash).toBeDefined();
      expect(signature.signatureHash).toMatch(/^[a-f0-9]{64}$/);
      expect(signature.documentHash).toBe('doc-hash-xyz');
    });

    it('should include audit trail fields', async () => {
      const signature = await createCFRCompliantSignature(
        { type: 'drawn', data: 'data:image/png;base64,abc123' },
        validContext
      );

      expect(signature.sessionId).toBe('session-abc');
      expect(signature.ipAddress).toBe('203.0.113.42');
      expect(signature.signatureVersion).toBe('1.0.0');
      expect(signature.userAgent).toBeDefined();
    });

    it('should include device metadata', async () => {
      const signature = await createCFRCompliantSignature(
        { type: 'drawn', data: 'data:image/png;base64,abc123' },
        validContext
      );

      expect(signature.deviceInfo).toBeDefined();
      expect(signature.deviceInfo?.platform).toBeDefined();
      expect(signature.deviceInfo?.browser).toBeDefined();
      expect(typeof signature.deviceInfo?.isMobile).toBe('boolean');
      expect(signature.deviceInfo?.screenResolution).toMatch(/^\d+x\d+$/);
    });

    it('should validate required context fields', async () => {
      const testCases = [
        { ...validContext, signerName: '' },
        { ...validContext, signerId: '' },
        { ...validContext, documentHash: '' },
      ];

      for (const invalidContext of testCases) {
        await expect(
          createCFRCompliantSignature(
            { type: 'drawn', data: 'data:image/png;base64,abc123' },
            invalidContext as any
          )
        ).rejects.toThrow();
      }
    });

    it('should validate signature intent', async () => {
      await expect(
        createCFRCompliantSignature(
          { type: 'drawn', data: 'data:image/png;base64,abc123' },
          validContext,
          '' // Empty intent
        )
      ).rejects.toThrow('signatureIntent is required');
    });

    it('should support both drawn and typed signatures', async () => {
      const drawnSignature = await createCFRCompliantSignature(
        { type: 'drawn', data: 'data:image/png;base64,abc123' },
        validContext
      );

      const typedSignature = await createCFRCompliantSignature(
        { type: 'typed', data: 'data:image/png;base64,def456' },
        validContext
      );

      expect(drawnSignature.type).toBe('drawn');
      expect(typedSignature.type).toBe('typed');
      expect(drawnSignature.signatureHash).not.toBe(typedSignature.signatureHash);
    });
  });

  describe('generateSignatureId - Cryptographic Security (CRIT-6)', () => {
    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      const count = 10000;

      for (let i = 0; i < count; i++) {
        ids.add(generateSignatureId());
      }

      // No collisions in 10,000 generations
      expect(ids.size).toBe(count);
    });

    it('should use RFC 4122 UUID v4 format', () => {
      const id = generateSignatureId();

      // Format: sig-{timestamp}-{uuid}
      expect(id).toMatch(/^sig-\d+-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
    });

    it('should be unpredictable', () => {
      const id1 = generateSignatureId();
      const id2 = generateSignatureId();

      // Extract UUID portions
      const uuid1 = id1.split('-').slice(2).join('-');
      const uuid2 = id2.split('-').slice(2).join('-');

      // UUIDs should be completely different
      expect(uuid1).not.toBe(uuid2);

      // No predictable pattern
      const uuid1Bytes = uuid1.replace(/-/g, '');
      const uuid2Bytes = uuid2.replace(/-/g, '');
      let sameBytes = 0;
      for (let i = 0; i < uuid1Bytes.length; i++) {
        if (uuid1Bytes[i] === uuid2Bytes[i]) sameBytes++;
      }

      // Less than 20% of bytes should match (would be ~50% if random, but could vary)
      expect(sameBytes).toBeLessThan(uuid1Bytes.length * 0.2);
    });

    it('should include timestamp for ordering', () => {
      const id1 = generateSignatureId();
      const timestamp1 = parseInt(id1.split('-')[1]);

      // Wait a bit
      vi.useFakeTimers();
      vi.advanceTimersByTime(10);

      const id2 = generateSignatureId();
      const timestamp2 = parseInt(id2.split('-')[1]);

      expect(timestamp2).toBeGreaterThanOrEqual(timestamp1);

      vi.useRealTimers();
    });
  });

  describe('validateImageDataUrl - XSS Prevention (CRIT-3)', () => {
    it('should accept valid PNG data URLs', () => {
      expect(validateImageDataUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')).toBe(true);
    });

    it('should accept valid JPEG data URLs', () => {
      expect(validateImageDataUrl('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAA=')).toBe(true);
    });

    it('should reject SVG data URLs (XSS risk)', () => {
      expect(validateImageDataUrl('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxzY3JpcHQ+YWxlcnQoMSk8L3NjcmlwdD48L3N2Zz4=')).toBe(false);
    });

    it('should reject data URLs exceeding size limit', () => {
      const largeDataUrl = 'data:image/png;base64,' + 'A'.repeat(6 * 1024 * 1024); // 6MB
      expect(validateImageDataUrl(largeDataUrl)).toBe(false);
    });

    it('should reject non-base64 data URLs', () => {
      expect(validateImageDataUrl('data:image/png,not-base64')).toBe(false);
    });

    it('should reject data URLs with null bytes', () => {
      expect(validateImageDataUrl('data:image/png;base64,abc\x00def')).toBe(false);
    });

    it('should reject empty or invalid input', () => {
      expect(validateImageDataUrl('')).toBe(false);
      expect(validateImageDataUrl(null as any)).toBe(false);
      expect(validateImageDataUrl(undefined as any)).toBe(false);
    });

    it('should reject malformed base64', () => {
      expect(validateImageDataUrl('data:image/png;base64,!!!invalid!!!')).toBe(false);
    });

    it('should validate base64 length constraints', () => {
      // Image size check: base64 data should decode to < 2MB
      const validDataUrl = 'data:image/png;base64,' + 'A'.repeat(1000); // ~750 bytes
      const tooLargeDataUrl = 'data:image/png;base64,' + 'A'.repeat(3 * 1024 * 1024); // ~2.25MB

      expect(validateImageDataUrl(validDataUrl)).toBe(true);
      expect(validateImageDataUrl(tooLargeDataUrl)).toBe(false);
    });
  });
});
