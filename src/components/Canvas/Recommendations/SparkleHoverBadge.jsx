import React, { useState } from 'react';

const SparkleHoverBadge = ({ onFindResources, onAsk }) => {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div
      className="absolute"
      style={{ top: -10, right: -10, zIndex: 40 }}
      onMouseEnter={() => setPanelOpen(true)}
      onMouseLeave={() => setPanelOpen(false)}
      onClick={(e) => e.stopPropagation()}
    >
      {panelOpen && (
        <div className="absolute right-0 bottom-full mb-1 flex gap-1 bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1.5 whitespace-nowrap">
          <button
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            onClick={() => { onFindResources(); setPanelOpen(false); }}
          >
            ✨ Find resources
          </button>
          <span className="text-gray-300 select-none">|</span>
          <button
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            onClick={() => { onAsk(); setPanelOpen(false); }}
          >
            ✦ Ask about this
          </button>
        </div>
      )}
      <button
        title="More options"
        className="w-5 h-5 flex items-center justify-center rounded-full bg-white border border-gray-300 shadow-sm text-gray-500 hover:bg-gray-50 text-xs"
      >
        ✦
      </button>
    </div>
  );
};

export default SparkleHoverBadge;
