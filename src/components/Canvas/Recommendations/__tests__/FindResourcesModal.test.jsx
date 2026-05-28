import { render, screen, fireEvent } from '@testing-library/react';
import FindResourcesModal from '../FindResourcesModal';

jest.mock('../ResourcePanel', () => ({ goalType, onClose }) => (
  <div data-testid="resource-panel">
    <span>{goalType ?? 'no-goal'}</span>
    <button onClick={onClose}>CloseInner</button>
  </div>
));

test('renders ResourcePanel inside modal', () => {
  render(
    <FindResourcesModal
      goalType="employment_search"
      domain="job_skills_education"
      onClose={jest.fn()}
      onSelectResource={jest.fn()}
      selectedResourceId={null}
    />
  );
  expect(screen.getByTestId('resource-panel')).toBeInTheDocument();
  expect(screen.getByText('employment_search')).toBeInTheDocument();
});

test('calls onClose when backdrop clicked', () => {
  const onClose = jest.fn();
  render(
    <FindResourcesModal
      goalType="employment_search"
      domain="job_skills_education"
      onClose={onClose}
      onSelectResource={jest.fn()}
      selectedResourceId={null}
    />
  );
  fireEvent.click(screen.getByTestId('modal-backdrop'));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('passes onClose through to ResourcePanel', () => {
  const onClose = jest.fn();
  render(
    <FindResourcesModal
      goalType="employment_search"
      domain="job_skills_education"
      onClose={onClose}
      onSelectResource={jest.fn()}
      selectedResourceId={null}
    />
  );
  fireEvent.click(screen.getByText('CloseInner'));
  expect(onClose).toHaveBeenCalledTimes(1);
});
