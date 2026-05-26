import React from 'react';
import { useCanvas } from '../Utils/CanvasContext';

const BoardResourcesSidebar = ({ onClose }) => {
  const { boardResources, setHighlightedStepIds } = useCanvas();

  return (
    <div
      className="absolute top-0 right-0 h-full bg-white shadow-xl flex flex-col"
      style={{ width: 240, zIndex: 50 }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-sm text-gray-900">Board Resources</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {boardResources.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">
            No resources on your board yet. Tap ✦ on any element to find and add resources.
          </p>
        ) : (
          boardResources.map((br) => (
            <div
              key={br.id}
              role="listitem"
              className="rounded-lg border border-gray-100 p-3 cursor-default hover:bg-gray-50 transition-colors"
              onMouseEnter={() => setHighlightedStepIds(br.stepIds)}
              onMouseLeave={() => setHighlightedStepIds([])}
            >
              <p className="text-xs font-semibold text-gray-900 leading-tight">{br.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">{br.stepIds.length} steps</span>
                <span
                  className="text-xs rounded-full px-2 py-0.5 font-medium"
                  style={
                    br.source === 'sonar'
                      ? { background: '#f0fdf4', color: '#166534' }
                      : { background: '#eff6ff', color: '#1e40af' }
                  }
                >
                  {br.source === 'sonar' ? '⚡ Live' : '🗄 Local'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BoardResourcesSidebar;
