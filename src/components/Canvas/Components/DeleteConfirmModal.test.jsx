import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteConfirmModal from './DeleteConfirmModal';

const baseSummary = {
  items: [
    { id: '1', type: 'mentor', label: 'Dr. Chen' },
    { id: '2', type: 'image', label: null },
    { id: '3', type: 'connection', label: 'my link' },
  ],
  implicitCount: 2,
};

test('renders item count in title', () => {
  render(
    <DeleteConfirmModal open summary={baseSummary} onClose={() => {}} onConfirm={() => {}} />
  );
  expect(screen.getByText(/delete 3 items/i)).toBeInTheDocument();
});

test('renders each item with type chip and label', () => {
  render(
    <DeleteConfirmModal open summary={baseSummary} onClose={() => {}} onConfirm={() => {}} />
  );
  expect(screen.getByText('mentor')).toBeInTheDocument();
  expect(screen.getByText('Dr. Chen')).toBeInTheDocument();
  expect(screen.getByText('image')).toBeInTheDocument();
  expect(screen.queryAllByText(/no label/i).length).toBeGreaterThan(0);
  expect(screen.getByText('connection')).toBeInTheDocument();
  expect(screen.getByText('my link')).toBeInTheDocument();
});

test('shows implicit count footer when implicitCount > 0', () => {
  render(
    <DeleteConfirmModal open summary={baseSummary} onClose={() => {}} onConfirm={() => {}} />
  );
  expect(screen.getByText(/2 attached/i)).toBeInTheDocument();
});

test('hides implicit footer when implicitCount is 0', () => {
  render(
    <DeleteConfirmModal
      open
      summary={{ ...baseSummary, implicitCount: 0 }}
      onClose={() => {}}
      onConfirm={() => {}}
    />
  );
  expect(screen.queryByText(/attached/i)).not.toBeInTheDocument();
});

test('calls onClose when Cancel is clicked', () => {
  const onClose = jest.fn();
  render(
    <DeleteConfirmModal open summary={baseSummary} onClose={onClose} onConfirm={() => {}} />
  );
  fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('calls onConfirm when Delete all is clicked', () => {
  const onConfirm = jest.fn();
  render(
    <DeleteConfirmModal open summary={baseSummary} onClose={() => {}} onConfirm={onConfirm} />
  );
  fireEvent.click(screen.getByRole('button', { name: /delete all/i }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
});
