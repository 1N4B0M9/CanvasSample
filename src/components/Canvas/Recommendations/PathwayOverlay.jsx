import React from 'react';

/**
 * Green pathway overlay rendered over the canvas when a resource card is hovered.
 * Uses position: absolute over the canvas container — NOT inside the Konva layer.
 *
 * @param {{ resource: object, onAddToBoard: () => void }} props
 */
const PathwayOverlay = ({ resource, onAddToBoard }) => {
  if (!resource) return null;

  const steps = resource.pathwaySteps ?? [];

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ zIndex: 45, background: 'rgba(0,0,0,0.25)', pointerEvents: 'none' }}
    >
      {/* Step nodes row */}
      <div className="flex items-center gap-0 mb-4">
        {steps.map((step, i) => (
          <React.Fragment key={step.order}>
            <div
              className="rounded-xl p-3 shadow-lg flex flex-col gap-1"
              style={{
                background: '#f0fdf4',
                border: '2px solid #22c55e',
                minWidth: 140,
                maxWidth: 180,
              }}
            >
              <span
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: '#14532d' }}
              >
                {step.actionLabel}
              </span>
              <span className="text-xs font-semibold text-gray-900 leading-tight">{step.title}</span>
              <span className="text-xs text-gray-500 leading-snug">{step.detail}</span>
              {step.url && (
                <a
                  href={step.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-500 hover:underline mt-1"
                  style={{ pointerEvents: 'auto' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Open link →
                </a>
              )}
            </div>
            {i < steps.length - 1 && (
              <span className="text-2xl font-bold mx-1" style={{ color: '#22c55e' }}>
                →
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Sonar live update */}
      {resource.sonarEnrichment && (
        <div
          className="rounded-lg px-4 py-2 mb-3 text-xs text-center max-w-sm"
          style={{ background: '#f0fdf4', border: '1px solid #22c55e', color: '#14532d' }}
        >
          ⚡ Sonar · {resource.sonarEnrichment}
        </div>
      )}

      {/* Resource anchor card */}
      <div
        className="rounded-xl shadow-xl px-5 py-4 flex flex-col items-center gap-2"
        style={{ background: '#fff', border: '2px solid #22c55e', minWidth: 220, pointerEvents: 'auto' }}
      >
        <p className="font-semibold text-sm text-gray-900">{resource.name}</p>
        {resource.contact?.phone && (
          <p className="text-xs text-gray-500">{resource.contact.phone}</p>
        )}
        {resource.contact?.url && (
          <a
            href={`https://${resource.contact.url}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-500 hover:underline"
          >
            {resource.contact.url}
          </a>
        )}
        <button
          onClick={onAddToBoard}
          className="mt-1 bg-gray-900 text-white text-xs font-semibold rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors"
        >
          + Add to board
        </button>
      </div>
    </div>
  );
};

export default PathwayOverlay;
