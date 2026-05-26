import React, { useState, useRef, useEffect } from 'react';

const SparkleHoverBadge = ({ onFindResources, onAsk, citations = [] }) => {
  const [sparkleOpen, setSparkleOpen] = useState(false);
  const [citationPanel, setCitationPanel] = useState(null); // null | 'sonar' | 'local'
  const containerRef = useRef(null);

  useEffect(() => {
    if (!sparkleOpen && !citationPanel) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSparkleOpen(false);
        setCitationPanel(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sparkleOpen, citationPanel]);

  const toggleSparkle = () => {
    setSparkleOpen((prev) => !prev);
    setCitationPanel(null);
  };

  const toggleCitationPanel = (type) => {
    setCitationPanel((prev) => (prev === type ? null : type));
    setSparkleOpen(false);
  };

  const normalized = citations.map((c) =>
    typeof c === 'string'
      ? { url: c, title: c, date: null, source: 'local' }
      : c
  );
  const sonarCitations = normalized.filter((c) => c.source === 'sonar');
  const localCitations = normalized.filter((c) => c.source === 'local');

  const activeCitations = citationPanel === 'sonar' ? sonarCitations : localCitations;

  return (
    <div
      ref={containerRef}
      className="absolute flex gap-1"
      style={{ top: -10, right: -10, zIndex: 40 }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Citation panel dropdown */}
      {citationPanel && activeCitations.length > 0 && (
        <div className="absolute right-0 bottom-full mb-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-64">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            {citationPanel === 'sonar' ? '🌐 Live Sources' : '🗄️ Local Sources'}
          </p>
          {activeCitations.map((c) => (
            <a
              key={c.url}
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-blue-600 hover:underline mb-1"
            >
              <span className="font-medium">
                {c.title && c.title !== c.url ? c.title : c.url}
              </span>
              {c.date && (
                <span className="text-gray-400 ml-1">· {c.date}</span>
              )}
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

      {/* Local (database) source button */}
      {localCitations.length > 0 && (
        <button
          title="Local sources"
          className={`w-5 h-5 flex items-center justify-center rounded-full border shadow-sm text-xs ${
            citationPanel === 'local'
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
          onClick={() => toggleCitationPanel('local')}
        >
          🗄️
        </button>
      )}

      {/* Sonar (globe) source button */}
      {sonarCitations.length > 0 && (
        <button
          title="Live sources"
          className={`w-5 h-5 flex items-center justify-center rounded-full border shadow-sm text-xs ${
            citationPanel === 'sonar'
              ? 'bg-green-600 border-green-600 text-white'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
          onClick={() => toggleCitationPanel('sonar')}
        >
          🌐
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
