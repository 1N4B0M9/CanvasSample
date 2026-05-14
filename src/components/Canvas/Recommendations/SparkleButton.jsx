import React from 'react';

/**
 * Floating button anchored to bottom-right of the canvas.
 * Pulses when resourceCount > 0.
 *
 * @param {{ resourceCount: number, onOpen: () => void }} props
 */
const SparkleButton = ({ resourceCount, onOpen }) => {
  const hasSuggestions = resourceCount > 0;

  return (
    <button
      onClick={onOpen}
      title={hasSuggestions ? `${resourceCount} goal${resourceCount !== 1 ? 's' : ''} detected — tap to find resources` : 'Find resources for your goals'}
      className="absolute z-50 flex items-center gap-2 bg-gray-900 text-white rounded-full px-4 py-2 text-sm font-semibold shadow-lg hover:bg-gray-700 transition-all"
      style={{
        bottom: 20,
        right: 20,
        animation: hasSuggestions ? 'pulse 2s infinite' : 'none',
      }}
    >
      <span>✨</span>
      <span>Resources</span>
      {hasSuggestions && (
        <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {resourceCount > 9 ? '9+' : resourceCount}
        </span>
      )}
    </button>
  );
};

export default SparkleButton;
