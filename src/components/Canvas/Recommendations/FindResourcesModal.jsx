import React from 'react';
import ResourcePanel from './ResourcePanel';

const FindResourcesModal = ({ goalType, domain, onClose, onSelectResource, selectedResourceId }) => {
  return (
    <>
      <div
        data-testid="modal-backdrop"
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.4)', zIndex: 55 }}
        onClick={onClose}
      />
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 60, pointerEvents: 'none' }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            width: 360,
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <ResourcePanel
            goalType={goalType}
            domain={domain}
            onClose={onClose}
            onSelectResource={onSelectResource}
            selectedResourceId={selectedResourceId}
          />
        </div>
      </div>
    </>
  );
};

export default FindResourcesModal;
