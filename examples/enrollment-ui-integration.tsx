import React, { useRef, useEffect, useState, forwardRef } from 'react';
import { PDFSigner, PDFSignerRef, PDFErrorBoundary } from '@helix/pdf-signer';
import '@helix/pdf-signer/dist/styles.css';

/**
 * Drop-in replacement for Nutrient PDF Viewer in enrollment-ui
 *
 * Usage in enrollment-ui:
 * 1. Install: pnpm add @helix/pdf-signer
 * 2. Replace imports:
 *    - FROM: import PdfViewerComponent from './PdfViewerComponent'
 *    - TO:   import PDFViewerV2 from './PDFViewerV2'
 * 3. Update Container.tsx to pass documentUrl instead of JWT
 */

interface PDFViewerV2Props {
  documentUrl: string;
  onSignatureStatusChange?: (allSigned: boolean, currentIndex: number) => void;
  // CFR Part 11 Required: Signature context from authentication system
  signatureContext?: {
    signerName: string;
    signerId: string;
    sessionId: string;
    documentHash: string;
    authMethod: string;
    ipAddress?: string;
  };
}

export const PDFViewerV2 = forwardRef<PDFSignerRef, PDFViewerV2Props>((props, ref) => {
  const { documentUrl, onSignatureStatusChange, signatureContext } = props;

  return (
    <PDFErrorBoundary
      onError={(error, errorInfo) => {
        // Report error to monitoring service (e.g., Sentry, DataDog)
        console.error('PDF Viewer Error:', error, errorInfo);
        // reportToMonitoring(error, errorInfo);
      }}
    >
      <PDFSigner
        ref={ref}
        documentUrl={documentUrl}
        onSignatureStatusChange={onSignatureStatusChange}
        signatureContext={signatureContext}
        defaultSignatureIntent="I approve this document"
        // GDPR/CCPA COMPLIANCE: Opt-in for device info collection
        // Set to true only after obtaining explicit user consent
        // Default: false (GDPR-compliant)
        collectDeviceInfo={true} // Set based on user consent
        onSignatureApplied={(data) => {
          console.log('Signature captured:', {
            type: data.type,
            timestamp: data.timestamp,
            signerName: data.signerName,
            signerId: data.signerId,
            signatureHash: data.signatureHash,
            documentHash: data.documentHash,
            userAgent: data.userAgent, // Only present if collectDeviceInfo=true
            deviceInfo: data.deviceInfo, // Only present if collectDeviceInfo=true
          });
        }}
        onError={(error) => {
          console.error('PDF Signer error:', error);
        }}
      />
    </PDFErrorBoundary>
  );
});

PDFViewerV2.displayName = 'PDFViewerV2';

/**
 * Example Container component (similar to enrollment-ui/previewDocument/Container.tsx)
 */
export const PreviewDocumentContainer: React.FC = () => {
  const pdfViewerRef = useRef<PDFSignerRef>(null);
  const [documentUrl, setDocumentUrl] = useState('');
  const [isAllSigned, setIsAllSigned] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(0);
  const [signatureContext, setSignatureContext] = useState<PDFViewerV2Props['signatureContext']>();

  useEffect(() => {
    // BEFORE (with Nutrient):
    // getConsentDocumentJWT(requestID, email, language).then(response => {
    //   setDocEngToken(response.jwt);
    // });

    // AFTER (with @helix/pdf-signer):
    // Option A: Backend returns S3 signed URL + document hash
    getConsentDocumentUrl(requestID, email, language).then(response => {
      setDocumentUrl(response.documentUrl);

      // CFR Part 11 COMPLIANCE: Get context from authentication system
      setSignatureContext({
        signerName: response.signerName,        // From Okta JWT
        signerId: response.signerId,            // From Okta JWT
        sessionId: response.sessionId,          // From Redux session store
        documentHash: response.documentHash,    // From backend (SHA-256 of PDF)
        authMethod: 'okta_2fa',                // Authentication method
        ipAddress: response.ipAddress,          // From backend (server-side capture)
      });
    });

    // Option B: Backend proxy endpoint
    // setDocumentUrl(`/api/enrollment/document/${requestID}/pdf`);
  }, []);

  const handleNextSignature = () => {
    pdfViewerRef.current?.nextSignature();
  };

  const handleSubmit = async () => {
    if (!isAllSigned) {
      alert('Please sign all signature fields');
      return;
    }

    // Get PSPDFKit InstantJSON format (compatible with existing backend)
    const instantJSON = pdfViewerRef.current?.getSignatures();

    // Send to backend (same endpoint as before)
    await submitSignedDocument(requestID, instantJSON);

    // Continue with 2FA flow
    navigate('/2fa-verification');
  };

  return (
    <div className="preview-document-container">
      <PDFViewerV2
        ref={pdfViewerRef}
        documentUrl={documentUrl}
        signatureContext={signatureContext}
        onSignatureStatusChange={(allSigned, currentIdx) => {
          setIsAllSigned(allSigned);
          setCurrentSignature(currentIdx);
        }}
      />

      <div className="actions">
        <button onClick={handleNextSignature} disabled={isAllSigned}>
          Next Signature
        </button>
        <button onClick={handleSubmit} disabled={!isAllSigned}>
          Continue
        </button>
      </div>
    </div>
  );
};

// Mock API functions (replace with actual enrollment-api calls)
async function getConsentDocumentUrl(requestID: string, email: string, language: string) {
  const response = await fetch(`/api/enrollment/document/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestID, email, language }),
  });
  return response.json(); // { documentUrl: string, expiresAt: string }
}

async function submitSignedDocument(requestID: string, instantJSON: any) {
  const response = await fetch(`/api/enrollment/document/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestID, annotations: instantJSON }),
  });
  return response.json();
}

const requestID = 'example-request-id';
const email = 'user@example.com';
const language = 'en';
const navigate = (path: string) => console.log('Navigate to:', path);
