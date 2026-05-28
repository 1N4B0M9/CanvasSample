import React, { useState, useEffect } from 'react';
import useGetPathway from './useGetPathway';

const FindResourcesModal = ({ goalType, domain, onClose, onAddToBoard }) => {
  const { fetchPathway, data, loading, error } = useGetPathway();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (goalType && domain) fetchPathway({ goalType, domain });
  }, [goalType, domain, fetchPathway]);

  const resources = [
    ...(data?.resources ?? []),
    ...(data?.sonarResources ?? []),
  ];

  const steps = selected?.pathwaySteps ?? [];

  return (
    <div
      className="absolute left-0 top-0 h-full bg-white flex flex-col shadow-2xl"
      style={{ width: 272, zIndex: 60, borderRight: '1px solid #e5e7eb' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <span className="font-semibold text-sm text-gray-900">✨ Resources for you</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {/* Resource list */}
        {loading && [1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg h-16 animate-pulse" />
        ))}

        {error && <p className="text-xs text-red-500 text-center py-4">{error}</p>}

        {!loading && !error && resources.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">
            {goalType ? 'No resources found for this goal.' : 'Tap a text element to detect a goal.'}
          </p>
        )}

        {!loading && resources.map((resource) => {
          const isSelected = selected?.id === resource.id;
          return (
            <div key={resource.id}>
              <div
                className="rounded-lg p-3 cursor-pointer transition-all"
                style={
                  isSelected
                    ? { border: '2px solid #3b82f6', boxShadow: '0 0 0 2px #bfdbfe', background: '#eff6ff' }
                    : { border: '1px solid #e5e7eb', background: '#fff' }
                }
                onClick={() => setSelected(isSelected ? null : resource)}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="text-xs font-semibold text-gray-900 leading-tight">{resource.name}</p>
                  {resource.source === 'sonar' && (
                    <span
                      className="shrink-0 text-xs font-semibold rounded-full px-2 py-0.5"
                      style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
                    >
                      ⚡
                    </span>
                  )}
                </div>
                {resource.description && (
                  <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">{resource.description}</p>
                )}
                {!isSelected && (
                  <p className="text-xs text-blue-400 mt-1">click to see path →</p>
                )}
              </div>

              {/* Inline path preview + add button */}
              {isSelected && steps.length > 0 && (
                <div className="mx-1 mb-1 flex flex-col">
                  {steps.map((step, i) => (
                    <React.Fragment key={step.order ?? i}>
                      <div
                        className="rounded-lg px-3 py-2"
                        style={{ background: '#f0fdf4', border: '1px solid #86efac' }}
                      >
                        {step.actionLabel && (
                          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#14532d' }}>
                            {step.actionLabel}
                          </p>
                        )}
                        <p className="text-xs font-semibold text-gray-900 leading-tight">{step.title}</p>
                        {step.detail && (
                          <p className="text-xs text-gray-500 leading-snug mt-0.5">{step.detail}</p>
                        )}
                      </div>
                      {i < steps.length - 1 && (
                        <div className="flex justify-center py-0.5 text-green-400 text-sm font-bold">↓</div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {isSelected && (
                <button
                  onClick={() => onAddToBoard(resource)}
                  className="mt-1 mx-1 w-[calc(100%-8px)] bg-gray-900 text-white text-xs font-semibold rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors"
                >
                  + Add to board
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FindResourcesModal;
