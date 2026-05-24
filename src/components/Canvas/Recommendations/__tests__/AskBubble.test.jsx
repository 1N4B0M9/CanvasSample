import { render, screen, fireEvent } from '@testing-library/react';
import AskBubble from '../AskBubble';

const defaultProps = {
  stepText: 'Attend intake appointment',
  goalText: 'Get housing',
  onSubmit: jest.fn(),
  onDismiss: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

test('renders text input and submit button', () => {
  render(<AskBubble {...defaultProps} />);
  expect(screen.getByRole('textbox')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
});

test('calls onSubmit with correct shape when submitted', () => {
  const onSubmit = jest.fn();
  render(<AskBubble {...defaultProps} onSubmit={onSubmit} />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'what now?' } });
  fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
  expect(onSubmit).toHaveBeenCalledWith({
    stepText: 'Attend intake appointment',
    goalText: 'Get housing',
    userQuery: 'what now?',
  });
});

test('does not call onSubmit when input is empty', () => {
  const onSubmit = jest.fn();
  render(<AskBubble {...defaultProps} onSubmit={onSubmit} />);
  fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
  expect(onSubmit).not.toHaveBeenCalled();
});

test('calls onDismiss when dismiss button clicked', () => {
  const onDismiss = jest.fn();
  render(<AskBubble {...defaultProps} onDismiss={onDismiss} />);
  fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

test('submits on Enter key', () => {
  const onSubmit = jest.fn();
  render(<AskBubble {...defaultProps} onSubmit={onSubmit} />);
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'help me' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(onSubmit).toHaveBeenCalledWith({
    stepText: 'Attend intake appointment',
    goalText: 'Get housing',
    userQuery: 'help me',
  });
});

test('calls onDismiss on Escape key', () => {
  const onDismiss = jest.fn();
  render(<AskBubble {...defaultProps} onDismiss={onDismiss} />);
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

test('disables input and submit when loading', () => {
  render(<AskBubble {...defaultProps} loading={true} />);
  expect(screen.getByRole('textbox')).toBeDisabled();
  expect(screen.getByRole('button', { name: /Submit/i })).toBeDisabled();
});
