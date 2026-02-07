import React, { useRef, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { PDFSigner, PDFSignerRef } from './src/index';
import './src/styles.css';

const TestApp: React.FC = () => {
  const pdfRef = useRef<PDFSignerRef>(null);
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [status, setStatus] = useState('Ready to load PDF');
  const [isLoaded, setIsLoaded] = useState(false);
  const [allSigned, setAllSigned] = useState(false);

  const updateStatus = (message: string, success = false) => {
    setStatus(message);
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = success ? 'status success' : 'status';
    }
  };

  const enableButtons = (enabled: boolean) => {
    (document.getElementById('nextBtn') as HTMLButtonElement).disabled = !enabled;
    (document.getElementById('prevBtn') as HTMLButtonElement).disabled = !enabled;
    (document.getElementById('getJsonBtn') as HTMLButtonElement).disabled = !enabled;
    (document.getElementById('clearBtn') as HTMLButtonElement).disabled = !enabled;
  };

  useEffect(() => {
    // Load button
    document.getElementById('loadBtn')?.addEventListener('click', () => {
      // Try multiple possible locations for the sample PDF
      const possibleUrls = [
        '/sample-document.pdf',
        '/public/sample-document.pdf',
        './sample-document.pdf',
        // You can add your own PDF URL here
        // 'https://example.com/your-pdf.pdf',
      ];

      updateStatus('Loading PDF...');
      setDocumentUrl(possibleUrls[0]); // Try first URL
      setIsLoaded(true);
      enableButtons(true);
    });

    // Next button
    document.getElementById('nextBtn')?.addEventListener('click', () => {
      pdfRef.current?.nextSignature();
      updateStatus('Navigating to next signature field...');
    });

    // Previous button
    document.getElementById('prevBtn')?.addEventListener('click', () => {
      pdfRef.current?.previousSignature();
      updateStatus('Navigating to previous signature field...');
    });

    // Get JSON button
    document.getElementById('getJsonBtn')?.addEventListener('click', () => {
      const json = pdfRef.current?.getSignatures();
      console.log('=== PSPDFKit InstantJSON Output ===');
      console.log(JSON.stringify(json, null, 2));
      console.log('===================================');

      // Also show in alert for quick viewing
      const annotationCount = json?.annotations?.length || 0;
      const attachmentCount = Object.keys(json?.attachments || {}).length;

      alert(
        `InstantJSON Output:\n\n` +
        `Format: ${json?.format}\n` +
        `Annotations: ${annotationCount}\n` +
        `Attachments: ${attachmentCount}\n\n` +
        `Full JSON logged to console (F12)`
      );

      updateStatus(`Generated InstantJSON with ${annotationCount} signatures`);
    });

    // Clear button
    document.getElementById('clearBtn')?.addEventListener('click', () => {
      if (confirm('Clear all signatures and reload PDF?')) {
        setDocumentUrl('');
        setIsLoaded(false);
        setAllSigned(false);
        enableButtons(false);
        updateStatus('Ready to load PDF');

        // Reload after a moment
        setTimeout(() => {
          setDocumentUrl('/sample-document.pdf');
          setIsLoaded(true);
          enableButtons(true);
          updateStatus('PDF reloaded');
        }, 100);
      }
    });
  }, []);

  if (!isLoaded) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
        <h2>Click "Load PDF" to begin testing</h2>
        <p style={{ marginTop: '16px' }}>
          Make sure you have a PDF with signature fields at:
        </p>
        <code style={{
          display: 'block',
          marginTop: '8px',
          padding: '8px',
          background: '#f5f5f5',
          borderRadius: '4px'
        }}>
          public/sample-document.pdf
        </code>
      </div>
    );
  }

  return (
    <PDFSigner
      ref={pdfRef}
      documentUrl={documentUrl}
      onSignatureStatusChange={(signed, currentIndex) => {
        const total = pdfRef.current?.getTotalSignatureCount() || 0;

        if (total === 0) {
          updateStatus('⚠️ No signature fields detected in PDF');
          return;
        }

        if (signed) {
          updateStatus(`✅ All ${total} signatures completed!`, true);
          setAllSigned(true);
        } else {
          updateStatus(`Signature ${currentIndex + 1} of ${total}`);
          setAllSigned(false);
        }
      }}
      onSignatureApplied={(data) => {
        console.log('Signature applied:', {
          type: data.type,
          timestamp: data.timestamp,
          userAgent: data.userAgent,
          dataLength: data.data.length,
        });
        updateStatus('✓ Signature applied successfully');
      }}
      onError={(error) => {
        console.error('PDF Signer Error:', error);
        updateStatus(`❌ Error: ${error.message}`);

        // Show helpful error message
        const errorEl = document.getElementById('viewer');
        if (errorEl) {
          errorEl.innerHTML = `
            <div class="error">
              <h2>Error Loading PDF</h2>
              <p style="margin: 16px 0;">${error.message}</p>
              <p>Common solutions:</p>
              <ul style="list-style: none; padding: 0; margin-top: 16px;">
                <li>• Make sure the PDF exists at <code>public/sample-document.pdf</code></li>
                <li>• Check that the PDF is not password protected</li>
                <li>• Verify the PDF contains signature form fields</li>
                <li>• Check browser console (F12) for detailed errors</li>
              </ul>
            </div>
          `;
        }
      }}
    />
  );
};

// Mount React app
const viewer = document.getElementById('viewer');
if (viewer) {
  createRoot(viewer).render(<TestApp />);
}
