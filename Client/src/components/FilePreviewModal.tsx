import React, { useState, useEffect } from 'react';
import { useFilePreview } from '../store/previewStore';
import { formatBytes, getFileCategory } from '../api/files/files.service';
import toast from 'react-hot-toast';

export function FilePreviewModal() {
  const {
    previewFile,
    isOpen,
    isMinimized,
    closePreview,
    minimizePreview,
    restorePreview,
  } = useFilePreview();

  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [docViewerSource, setDocViewerSource] = useState<'google' | 'office'>('google');

  // Reset states when preview file changes
  useEffect(() => {
    setZoomLevel(1);
    setTextContent(null);
    setDocViewerSource('google');

    if (!previewFile) return;

    const category = getFileCategory(previewFile.mime);

    // If it's a text file, load its contents
    if (category === 'text') {
      setTextLoading(true);
      if (previewFile.file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setTextContent((e.target?.result as string) || '');
          setTextLoading(false);
        };
        reader.onerror = () => {
          setTextContent('Failed to read text file.');
          setTextLoading(false);
        };
        reader.readAsText(previewFile.file);
      } else if (previewFile.url) {
        fetch(previewFile.url)
          .then((res) => res.text())
          .then((text) => {
            setTextContent(text);
            setTextLoading(false);
          })
          .catch(() => {
            setTextContent('Failed to fetch text content.');
            setTextLoading(false);
          });
      }
    }
  }, [previewFile]);

  if (!isOpen || !previewFile) return null;

  const category = getFileCategory(previewFile.mime);
  const effectiveUrl = previewFile.url || (previewFile.file ? URL.createObjectURL(previewFile.file) : '');

  // ---------------- MINIMIZED FLOATING CARD ----------------
  if (isMinimized) {
    return (
      <div
        className="
          fixed bottom-5 right-5 z-50
          flex items-center gap-3 p-3 px-4 rounded-2xl
          bg-white/95 dark:bg-[#181527]/95 backdrop-blur-xl
          border border-purple-300/80 dark:border-purple-800/80
          shadow-2xl shadow-purple-500/20
          animate-bounce-in max-w-sm cursor-pointer
          hover:scale-[1.02] transition-transform duration-200
        "
        onClick={restorePreview}
        title="Click to restore preview"
      >
        {/* Category Indicator Icon */}
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
          {category === 'image' && (
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          {category === 'pdf' && (
            <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )}
          {category === 'doc' && (
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {category === 'text' && (
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>

        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate max-w-[170px]">
              {previewFile.name}
            </span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
              {category}
            </span>
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
            Preview Minimized • Click to expand
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={restorePreview}
            className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
            title="Restore preview"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={closePreview}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // ---------------- EXPANDED / MODAL VIEW ----------------
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(previewFile.url)}&embedded=true`;
  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewFile.url)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={closePreview}
    >
      <div
        className="
          relative w-full max-w-5xl h-[88vh] flex flex-col rounded-3xl
          bg-white dark:bg-[#151322] border border-purple-200/80 dark:border-purple-900/60
          shadow-2xl shadow-purple-950/40 overflow-hidden
          transition-all duration-300
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="h-16 shrink-0 flex items-center justify-between px-5 sm:px-6 border-b border-purple-100/80 dark:border-purple-950/60 bg-white/70 dark:bg-[#191629]/70 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0 pr-3">
            {/* Category Icon */}
            <div className="w-9 h-9 rounded-xl bg-purple-100/80 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
              {category === 'image' && (
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              {category === 'pdf' && (
                <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
              {category === 'doc' && (
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {category === 'text' && (
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 truncate max-w-xs sm:max-w-md">
                  {previewFile.name}
                </h3>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                  {category}
                </span>
              </div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {previewFile.sizeBytes ? formatBytes(previewFile.sizeBytes) : 'Medical File'} • {previewFile.mime}
              </span>
            </div>
          </div>

          {/* Action Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Word doc viewer switcher */}
            {category === 'doc' && previewFile.url && (
              <div className="hidden sm:flex items-center bg-purple-100/60 dark:bg-purple-950/60 p-0.5 rounded-xl border border-purple-200 dark:border-purple-900/50 mr-2">
                <button
                  type="button"
                  onClick={() => setDocViewerSource('google')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    docViewerSource === 'google'
                      ? 'bg-white dark:bg-purple-900 text-purple-700 dark:text-purple-200 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                  }`}
                >
                  Google Viewer
                </button>
                <button
                  type="button"
                  onClick={() => setDocViewerSource('office')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    docViewerSource === 'office'
                      ? 'bg-white dark:bg-purple-900 text-purple-700 dark:text-purple-200 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                  }`}
                >
                  Office Viewer
                </button>
              </div>
            )}

            {/* External Open / Download Link */}
            {effectiveUrl && (
              <a
                href={effectiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-purple-600
                  hover:bg-purple-50 dark:hover:bg-purple-900/40 border border-transparent
                  hover:border-purple-200 dark:hover:border-purple-800/50 transition-all cursor-pointer
                "
                title="Open in new tab / download"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            {/* Minimize Button */}
            <button
              type="button"
              onClick={minimizePreview}
              className="
                p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-purple-600
                hover:bg-purple-50 dark:hover:bg-purple-900/40 border border-transparent
                hover:border-purple-200 dark:hover:border-purple-800/50 transition-all cursor-pointer
                flex items-center gap-1.5 font-medium text-xs
              "
              title="Minimize to floating preview"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 13H5" />
              </svg>
              <span className="hidden sm:inline">Minimize</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={closePreview}
              className="
                p-2 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50
                dark:hover:bg-red-950/40 transition-all cursor-pointer
              "
              title="Close preview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Viewer Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-[#0f0e18] relative flex items-center justify-center">
          {/* 1. IMAGE PREVIEW */}
          {category === 'image' && (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
              <div className="overflow-auto max-h-full max-w-full flex items-center justify-center">
                <img
                  src={effectiveUrl}
                  alt={previewFile.name}
                  style={{ transform: `scale(${zoomLevel})` }}
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg transition-transform duration-200"
                />
              </div>

              {/* Image Zoom Control Floating Bar */}
              <div className="absolute bottom-5 bg-white/90 dark:bg-[#1c192d]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-purple-200/80 dark:border-purple-800/60 shadow-lg flex items-center gap-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                  className="hover:text-purple-600 dark:hover:text-purple-400 p-1 cursor-pointer"
                  title="Zoom Out"
                >
                  −
                </button>
                <span>{Math.round(zoomLevel * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                  className="hover:text-purple-600 dark:hover:text-purple-400 p-1 cursor-pointer"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="text-[10px] text-gray-500 hover:text-purple-600 ml-1 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* 2. PDF PREVIEW */}
          {category === 'pdf' && (
            <div className="w-full h-full flex flex-col">
              <iframe
                src={`${effectiveUrl}#toolbar=1&navpanes=0`}
                title={previewFile.name}
                className="w-full h-full border-0"
              />
            </div>
          )}

          {/* 3. PLAIN TEXT PREVIEW */}
          {category === 'text' && (
            <div className="w-full h-full p-4 sm:p-6 overflow-auto">
              {textLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-purple-600">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">Reading text file...</span>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto bg-white dark:bg-[#181628] rounded-2xl border border-purple-100 dark:border-purple-900/50 p-4 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-purple-950/60 text-xs text-gray-500">
                    <span>Text document ({textContent?.split('\n').length || 0} lines)</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (textContent) {
                          navigator.clipboard.writeText(textContent);
                          toast.success('Text copied to clipboard!');
                        }
                      }}
                      className="text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy All
                    </button>
                  </div>
                  <pre className="font-mono text-xs sm:text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed select-text">
                    {textContent || 'No content found.'}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* 4. WORD DOCUMENT PREVIEW (.doc, .docx) */}
          {category === 'doc' && (
            <div className="w-full h-full flex flex-col">
              {previewFile.url ? (
                <iframe
                  src={docViewerSource === 'google' ? googleDocsViewerUrl : officeViewerUrl}
                  title={previewFile.name}
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">
                    Word Document Staged
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
                    Document preview will be generated using cloud rendering as soon as the file finishes uploading to secure storage.
                  </p>
                  {effectiveUrl && (
                    <a
                      href={effectiveUrl}
                      download={previewFile.name}
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold shadow-md hover:bg-purple-700 transition-colors"
                    >
                      Download Local File
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="h-10 shrink-0 px-6 bg-white/50 dark:bg-[#141221]/50 border-t border-purple-100/60 dark:border-purple-950/40 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1.5 font-medium text-purple-600 dark:text-purple-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            MedGPT Secure Medical Document Preview
          </span>
          <span className="hidden sm:inline">
            Confidential Healthcare Consultation
          </span>
        </div>
      </div>
    </div>
  );
}

export default FilePreviewModal;
