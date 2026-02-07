import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePDFDocument } from '../../src/hooks/usePDFDocument';
import { pdfjs } from 'pdfjs-dist';

/**
 * SECURITY TEST: Memory Leak Prevention (CRIT-4)
 *
 * Tests that PDF documents are properly cleaned up to prevent:
 * - Memory leaks (each PDF can use 10-50MB)
 * - Sensitive PDF data remaining in memory
 * - Resource exhaustion from leaked worker threads
 *
 * CWE-401: Missing Release of Memory after Effective Lifetime
 * CWE-772: Missing Release of Resource after Effective Lifetime
 */

describe('usePDFDocument - Memory Leak Prevention', () => {
  let mockPdfDocument: any;
  let destroySpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock PDF.js getDocument
    destroySpy = vi.fn();
    mockPdfDocument = {
      numPages: 1,
      destroy: destroySpy,
    };

    vi.spyOn(pdfjs, 'getDocument').mockReturnValue({
      promise: Promise.resolve(mockPdfDocument),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should clean up PDF document on unmount', async () => {
    const { unmount } = renderHook(() =>
      usePDFDocument('https://example.com/test.pdf')
    );

    // Wait for document to load
    await waitFor(() => {
      expect(mockPdfDocument.destroy).not.toHaveBeenCalled();
    });

    // Unmount hook (cleanup)
    unmount();

    // Verify destroy was called
    await waitFor(() => {
      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  });

  it('should clean up PDF document when URL changes', async () => {
    const { rerender } = renderHook(
      ({ url }) => usePDFDocument(url),
      { initialProps: { url: 'https://example.com/test1.pdf' } }
    );

    // Wait for first document to load
    await waitFor(() => {
      expect(pdfjs.getDocument).toHaveBeenCalledWith('https://example.com/test1.pdf');
    });

    // Change URL (should trigger cleanup of old document)
    rerender({ url: 'https://example.com/test2.pdf' });

    // Verify old document was destroyed
    await waitFor(() => {
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  it('should handle cleanup during load (race condition)', async () => {
    // Create a promise that won't resolve immediately
    let resolveLoad: (value: any) => void;
    const loadPromise = new Promise((resolve) => {
      resolveLoad = resolve;
    });

    vi.spyOn(pdfjs, 'getDocument').mockReturnValue({
      promise: loadPromise,
    } as any);

    const { unmount } = renderHook(() =>
      usePDFDocument('https://example.com/test.pdf')
    );

    // Unmount before load completes
    unmount();

    // Complete the load
    resolveLoad!(mockPdfDocument);

    // Verify document was destroyed even though component unmounted
    await waitFor(() => {
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  it('should not call destroy if load failed', async () => {
    // Mock load failure
    vi.spyOn(pdfjs, 'getDocument').mockReturnValue({
      promise: Promise.reject(new Error('Failed to load PDF')),
    } as any);

    const { unmount, result } = renderHook(() =>
      usePDFDocument('https://example.com/test.pdf')
    );

    // Wait for error state
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Unmount
    unmount();

    // Verify destroy was not called (no document to destroy)
    expect(destroySpy).not.toHaveBeenCalled();
  });

  it('should handle multiple rapid unmount/remount cycles', async () => {
    const { unmount, rerender } = renderHook(
      ({ url }) => usePDFDocument(url),
      { initialProps: { url: 'https://example.com/test.pdf' } }
    );

    // Simulate rapid URL changes
    for (let i = 0; i < 5; i++) {
      rerender({ url: `https://example.com/test${i}.pdf` });
    }

    unmount();

    // Verify destroy was called for each document load
    // (may be called multiple times due to race conditions, but at least once)
    await waitFor(() => {
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
