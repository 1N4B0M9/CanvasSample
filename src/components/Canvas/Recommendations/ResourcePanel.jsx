import React, { useEffect } from 'react';
import useGetPathway from './useGetPathway';

/**
 * Slide-in resource panel from the right edge of the canvas.
 * Calls getPathway on mount when goalType is provided.
 *
 * @param {{
 *   goalType: string|null,
 *   domain: string|null,
 *   onClose: () => void,
 *   onSelectResource: (resource: object|null) => void,
 *   selectedResourceId: string|null
 * }} props
 */
const ResourcePanel = ({ goalType, domain, onClose, onSelectResource, selectedResourceId }) => {
  const { fetchPathway, data, loading, error } = useGetPathway();

  useEffect(() => {
    if (goalType && domain) {
      fetchPathway({ goalType, domain });
    }
  }, [goalType, domain, fetchPathway]);

  const resources = [
    ...(data?.resources ?? []),
    ...(data?.sonarResources ?? []),
  ];

  return (
    <div
      className="h-full bg-white flex flex-col"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-semibold text-sm text-gray-900">✨ Resources for you</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Close panel"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
          {loading && (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-lg h-20 animate-pulse" />
              ))}
            </>
          )}

          {error && (
            <p className="text-xs text-red-500 text-center py-4">{error}</p>
          )}

          {!loading && !error && resources.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">
              {goalType ? 'No resources found yet for this goal.' : 'Tap a text element on your board to detect a goal.'}
            </p>
          )}

          {!loading &&
            resources.map((resource) => (
              <div
                key={resource.id}
                className="rounded-lg border p-3 cursor-pointer transition-all"
                style={
                  selectedResourceId === resource.id
                    ? { position: 'relative', border: '2px solid #3b82f6', boxShadow: '0 0 0 2px #bfdbfe' }
                    : { position: 'relative', border: '1px solid #f3f4f6' }
                }
                onClick={() =>
                  onSelectResource(selectedResourceId === resource.id ? null : resource)
                }
              >
                <p className="text-xs font-semibold text-gray-900 leading-tight">{resource.name}</p>
                {resource.source === 'sonar' && (
                  <span
                    className="absolute top-2 right-2 text-xs font-semibold rounded-full px-2 py-0.5"
                    style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
                  >
                    ⚡ Live
                  </span>
                )}
                <p className="text-xs text-gray-500 mt-1 leading-snug">{resource.description}</p>
                {resource.contact?.url && (
                  <a
                    href={resource.contact.url.startsWith('http') ? resource.contact.url : `https://${resource.contact.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-500 hover:underline mt-1 block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {resource.contact.url}
                  </a>
                )}
                <p className="text-xs text-blue-400 mt-1">click to see path</p>
              </div>
            ))}
        </div>
    </div>
  );
};

export default ResourcePanel;
