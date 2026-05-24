import { render, screen, fireEvent } from '@testing-library/react';
import SparkleHoverBadge from '../SparkleHoverBadge';

beforeEach(() => jest.clearAllMocks());

test('renders the sparkle badge button', () => {
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={jest.fn()} />);
  expect(screen.getByTitle('More options')).toBeInTheDocument();
});

test('action panel is not visible before hover', () => {
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={jest.fn()} />);
  expect(screen.queryByText(/Find resources/)).not.toBeInTheDocument();
});

test('action panel appears on hover', () => {
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={jest.fn()} />);
  fireEvent.mouseEnter(screen.getByTitle('More options').parentElement);
  expect(screen.getByText(/Find resources/)).toBeInTheDocument();
  expect(screen.getByText(/Ask about this/)).toBeInTheDocument();
});

test('calls onFindResources when "Find resources" clicked', () => {
  const onFindResources = jest.fn();
  render(<SparkleHoverBadge onFindResources={onFindResources} onAsk={jest.fn()} />);
  fireEvent.mouseEnter(screen.getByTitle('More options').parentElement);
  fireEvent.click(screen.getByText(/Find resources/));
  expect(onFindResources).toHaveBeenCalledTimes(1);
});

test('calls onAsk when "Ask about this" clicked', () => {
  const onAsk = jest.fn();
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={onAsk} />);
  fireEvent.mouseEnter(screen.getByTitle('More options').parentElement);
  fireEvent.click(screen.getByText(/Ask about this/));
  expect(onAsk).toHaveBeenCalledTimes(1);
});
