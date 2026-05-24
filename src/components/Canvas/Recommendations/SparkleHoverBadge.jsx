import React, { useState, useRef, useEffect } from 'react';

const SparkleHoverBadge = ({ onFindResources, onAsk, citations = [] }) => {
  const [sparkleOpen, setSparkleOpen] = useState(false);
  const [citationsOpen, setCitationsOpen] = useState(false);
  const containerRef = useRef(null);

  // close both panels on outside click
  useEffect(() => {
    if (!sparkleOpen && !citationsOpen) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSparkleOpen(false);
        setCitationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sparkleOpen, citationsOpen]);

  const toggleSparkle = () => {
    setSparkleOpen((prev) => !prev);
    setCitationsOpen(false);
  };

  const toggleCitations = () => {
    setCitationsOpen((prev) => !prev);
    setSparkleOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="absolute flex gap-1"
      style={{ top: -10, right: -10, zIndex: 40 }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Citations panel */}
      {citationsOpen && citations.length > 0 && (
        <div className="absolute right-0 bottom-full mb-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-64">
          <p className="text-xs font-semibold text-gray-700 mb-2">Sources</p>
          {citations.map((url, i) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-blue-600 truncate hover:underline mb-1"
            >
              {url}
            </a>
          ))}
        </div>
      )}

      {/* Sparkle options panel */}
      {sparkleOpen && (
        <div className="absolute right-0 bottom-full mb-2 flex gap-1 bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1.5 whitespace-nowrap">
          {onFindResources && (
            <>
              <button
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => { onFindResources(); setSparkleOpen(false); }}
              >
                ✨ Find resources
              </button>
              <span className="text-gray-300 select-none">|</span>
            </>
          )}
          <button
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            onClick={() => { onAsk(); setSparkleOpen(false); }}
          >
            ✦ Ask about this
          </button>
        </div>
      )}

      {/* Paperclip button — only when element has citations */}
      {citations.length > 0 && (
        <button
          title="View sources"
          className={`w-5 h-5 flex items-center justify-center rounded-full border shadow-sm text-xs ${
            citationsOpen
              ? 'bg-green-600 border-green-600 text-white'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
          onClick={toggleCitations}
        >
          📎
        </button>
      )}

      {/* Sparkle button */}
      <button
        title="More options"
        className={`w-5 h-5 flex items-center justify-center rounded-full border shadow-sm text-xs ${
          sparkleOpen
            ? 'bg-indigo-600 border-indigo-600 text-white'
            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
        }`}
        onClick={toggleSparkle}
      >
        ✦
      </button>
    </div>
  );
};

export default SparkleHoverBadge;
