import { render, screen, fireEvent } from '@testing-library/react';
import SparkleHoverBadge from '../SparkleHoverBadge';

beforeEach(() => jest.clearAllMocks());

test('renders the sparkle badge button', () => {
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={jest.fn()} />);
  expect(screen.getByTitle('More options')).toBeInTheDocument();
});

test('action panel is not visible before click', () => {
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={jest.fn()} />);
  expect(screen.queryByText(/Find resources/)).not.toBeInTheDocument();
});

test('action panel appears on sparkle button click', () => {
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={jest.fn()} />);
  fireEvent.click(screen.getByTitle('More options'));
  expect(screen.getByText(/Find resources/)).toBeInTheDocument();
  expect(screen.getByText(/Ask about this/)).toBeInTheDocument();
});

test('calls onFindResources when "Find resources" clicked', () => {
  const onFindResources = jest.fn();
  render(<SparkleHoverBadge onFindResources={onFindResources} onAsk={jest.fn()} />);
  fireEvent.click(screen.getByTitle('More options'));
  fireEvent.click(screen.getByText(/Find resources/));
  expect(onFindResources).toHaveBeenCalledTimes(1);
});

test('calls onAsk when "Ask about this" clicked', () => {
  const onAsk = jest.fn();
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={onAsk} />);
  fireEvent.click(screen.getByTitle('More options'));
  fireEvent.click(screen.getByText(/Ask about this/));
  expect(onAsk).toHaveBeenCalledTimes(1);
});

test('hides Find Resources button when onFindResources is null', () => {
  render(<SparkleHoverBadge onFindResources={null} onAsk={jest.fn()} />);
  fireEvent.click(screen.getByTitle('More options'));
  expect(screen.queryByText(/Find resources/)).not.toBeInTheDocument();
  expect(screen.getByText(/Ask about this/)).toBeInTheDocument();
});

test('shows paperclip button when citations provided', () => {
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={jest.fn()} citations={['https://example.com']} />);
  expect(screen.getByTitle('View sources')).toBeInTheDocument();
});

test('paperclip button not shown when no citations', () => {
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={jest.fn()} />);
  expect(screen.queryByTitle('View sources')).not.toBeInTheDocument();
});

test('citations panel opens on paperclip click', () => {
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={jest.fn()} citations={['https://example.com']} />);
  fireEvent.click(screen.getByTitle('View sources'));
  expect(screen.getByText('https://example.com')).toBeInTheDocument();
});
