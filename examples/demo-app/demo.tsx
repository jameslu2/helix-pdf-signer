import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PDFSigner, PDFSignerRef } from '../../src';
import '../../src/styles.css';

const Demo: React.FC = () => {
  const pdfRef = useRef<PDFSignerRef>(null);
  const [documentUrl, setDocumentUrl] = useState('');
  const [status, setStatus] = useState('Ready to load document');

  const handleLoadSample = () => {
    // In production, this would be a real PDF URL
    // For demo, you'd need to provide a sample PDF
    const sampleUrl = '/sample-document.pdf';
    setDocumentUrl(sampleUrl);
    setStatus('Loading document...');
  };

  const handleNextSignature = () => {
    pdfRef.current?.nextSignature();
  };

  const handlePreviousSignature = () => {
    pdfRef.current?.previousSignature();
  };

  const handleGetJson = () => {
    const instantJSON = pdfRef.current?.getSignatures();
    console.log('PSPDFKit InstantJSON:', instantJSON);
    alert('InstantJSON logged to console');
  };

  return (
    <>
      <div style={{ display: 'none' }}>
        <button id="loadSample" onClick={handleLoadSample}>
          Load Sample
        </button>
        <button id="nextSig" onClick={handleNextSignature}>
          Next
        </button>
        <button id="prevSig" onClick={handlePreviousSignature}>
          Previous
        </button>
        <button id="getJson" onClick={handleGetJson}>
          Get JSON
        </button>
      </div>

      {documentUrl && (
        <PDFSigner
          ref={pdfRef}
          documentUrl={documentUrl}
          onSignatureStatusChange={(allSigned, currentIndex) => {
            const total = pdfRef.current?.getTotalSignatureCount() || 0;
            if (allSigned) {
              setStatus(`✓ All ${total} signatures completed`);
            } else {
              setStatus(`Signature ${currentIndex + 1} of ${total}`);
            }
          }}
          onSignatureApplied={(data) => {
            console.log('Signature applied:', data);
          }}
          onError={(error) => {
            console.error('Error:', error);
            setStatus(`Error: ${error.message}`);
          }}
        />
      )}
    </>
  );
};

// Mount React app
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<Demo />);
}

// Wire up demo controls
document.getElementById('loadSample')?.addEventListener('click', () => {
  document.querySelector<HTMLButtonElement>('button#loadSample')?.click();
});

document.getElementById('nextSig')?.addEventListener('click', () => {
  document.querySelector<HTMLButtonElement>('button#nextSig')?.click();
});

document.getElementById('prevSig')?.addEventListener('click', () => {
  document.querySelector<HTMLButtonElement>('button#prevSig')?.click();
});

document.getElementById('getJson')?.addEventListener('click', () => {
  document.querySelector<HTMLButtonElement>('button#getJson')?.click();
});

const statusDiv = document.getElementById('status');
const observer = new MutationObserver(() => {
  const status = document.querySelector('.demo-status');
  if (status && statusDiv) {
    statusDiv.textContent = status.textContent;
  }
});
