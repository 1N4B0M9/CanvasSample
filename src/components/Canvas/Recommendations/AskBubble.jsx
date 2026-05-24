import React, { useState } from 'react';

const AskBubble = ({ stepText, goalText, onSubmit, onDismiss }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    if (!query.trim()) return;
    onSubmit({ stepText, goalText, userQuery: query.trim() });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onDismiss();
  };

  return (
    <div
      className="absolute z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-64"
      style={{ top: '100%', left: 0, marginTop: 8 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700">Ask about this step</span>
        <button
          className="text-gray-400 hover:text-gray-600 text-xs"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What should I expect?"
          className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-gray-400"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          className="px-2 py-1.5 bg-gray-900 text-white rounded text-xs font-semibold hover:bg-gray-700"
          aria-label="Submit"
        >
          →
        </button>
      </div>
    </div>
  );
};

export default AskBubble;
