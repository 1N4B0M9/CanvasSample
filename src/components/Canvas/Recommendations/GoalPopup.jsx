import React from 'react';

const GOAL_LABELS = {
  professional_license_reinstatement: 'Professional License',
  vocational_training: 'Job Training',
  employment_search: 'Employment',
  sobriety_recovery: 'Recovery',
  mental_health_counseling: 'Mental Health',
  housing_stability: 'Housing',
  financial_literacy: 'Financial Skills',
  family_reunification: 'Family Reunification',
  childcare_support: 'Childcare',
  legal_aid: 'Legal Aid',
  education_ged_college: 'Education',
  peer_support: 'Peer Support',
};

/**
 * Small popup anchored below a text element when a goal is detected.
 *
 * @param {{ goalType: string, domain: string, onFindResources: () => void, onDismiss: () => void }} props
 */
const GoalPopup = ({ goalType, domain, onFindResources, onDismiss }) => {
  const label = GOAL_LABELS[goalType] || goalType;

  return (
    <div
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2"
      style={{ top: '100%', left: 0, marginTop: 6, whiteSpace: 'nowrap' }}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="text-xs text-gray-500">{label}</span>
      <button
        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
        onClick={() => {
          onFindResources();
          onDismiss();
        }}
      >
        ✨ Find resources →
      </button>
      <button
        className="text-gray-400 hover:text-gray-600 text-xs ml-1"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
};

export default GoalPopup;
