import React from 'react';
import { ToolbarProps } from '../../types';

export const Toolbar: React.FC<ToolbarProps> = ({
  currentPage,
  numPages,
  zoom,
  onZoomChange,
  onPageChange,
  onNextSignature,
  onPreviousSignature,
  currentSignatureIndex,
  totalSignatures,
}) => {
  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom - 0.25, 0.5));
  };

  const handleFitWidth = () => {
    onZoomChange(1.0);
  };

  const handlePreviousPage = () => {
    onPageChange(Math.max(currentPage - 1, 1));
  };

  const handleNextPage = () => {
    onPageChange(Math.min(currentPage + 1, numPages));
  };

  return (
    <div className="pdf-toolbar">
      <div className="pdf-toolbar-section">
        <button
          onClick={handlePreviousPage}
          disabled={currentPage <= 1}
          className="pdf-toolbar-btn"
          aria-label="Previous page"
        >
          ◀
        </button>
        <span className="pdf-toolbar-text">
          Page {currentPage} of {numPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage >= numPages}
          className="pdf-toolbar-btn"
          aria-label="Next page"
        >
          ▶
        </button>
      </div>

      <div className="pdf-toolbar-section">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="pdf-toolbar-btn"
          aria-label="Zoom out"
        >
          -
        </button>
        <span className="pdf-toolbar-text">{Math.round(zoom * 100)}%</span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 3.0}
          className="pdf-toolbar-btn"
          aria-label="Zoom in"
        >
          +
        </button>
        <button onClick={handleFitWidth} className="pdf-toolbar-btn">
          Fit Width
        </button>
      </div>

      {totalSignatures !== undefined && totalSignatures > 0 && (
        <div className="pdf-toolbar-section">
          <button
            onClick={onPreviousSignature}
            disabled={currentSignatureIndex === 0}
            className="pdf-toolbar-btn"
            aria-label="Previous signature"
          >
            ← Prev Signature
          </button>
          <span className="pdf-toolbar-text">
            Signature {(currentSignatureIndex ?? 0) + 1} of {totalSignatures}
          </span>
          <button
            onClick={onNextSignature}
            disabled={
              currentSignatureIndex === undefined ||
              currentSignatureIndex >= totalSignatures - 1
            }
            className="pdf-toolbar-btn"
            aria-label="Next signature"
          >
            Next Signature →
          </button>
        </div>
      )}
    </div>
  );
};
