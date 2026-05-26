import { render, screen, fireEvent } from '@testing-library/react';
import SparkleHoverBadge from '../SparkleHoverBadge';

beforeEach(() => jest.clearAllMocks());

// --- Sparkle button (unchanged behavior) ---

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

// --- Citation source icon buttons ---

test('no source buttons shown when no citations', () => {
  render(<SparkleHoverBadge onFindResources={jest.fn()} onAsk={jest.fn()} />);
  expect(screen.queryByTitle('Local sources')).not.toBeInTheDocument();
  expect(screen.queryByTitle('Live sources')).not.toBeInTheDocument();
});

test('shows database button for local citations', () => {
  render(
    <SparkleHoverBadge
      onFindResources={jest.fn()}
      onAsk={jest.fn()}
      citations={[{ url: 'https://a.com', title: 'Site A', date: null, source: 'local' }]}
    />
  );
  expect(screen.getByTitle('Local sources')).toBeInTheDocument();
  expect(screen.queryByTitle('Live sources')).not.toBeInTheDocument();
});

test('shows globe button for sonar citations', () => {
  render(
    <SparkleHoverBadge
      onFindResources={jest.fn()}
      onAsk={jest.fn()}
      citations={[{ url: 'https://b.com', title: 'Site B', date: '2025-01-01', source: 'sonar' }]}
    />
  );
  expect(screen.getByTitle('Live sources')).toBeInTheDocument();
  expect(screen.queryByTitle('Local sources')).not.toBeInTheDocument();
});

test('shows both buttons when citations have both sources', () => {
  render(
    <SparkleHoverBadge
      onFindResources={jest.fn()}
      onAsk={jest.fn()}
      citations={[
        { url: 'https://a.com', title: 'Site A', date: null, source: 'local' },
        { url: 'https://b.com', title: 'Site B', date: '2025-01-01', source: 'sonar' },
      ]}
    />
  );
  expect(screen.getByTitle('Local sources')).toBeInTheDocument();
  expect(screen.getByTitle('Live sources')).toBeInTheDocument();
});

test('local citations panel shows title on database button click', () => {
  render(
    <SparkleHoverBadge
      onFindResources={jest.fn()}
      onAsk={jest.fn()}
      citations={[{ url: 'https://a.com', title: 'Housing Authority', date: null, source: 'local' }]}
    />
  );
  fireEvent.click(screen.getByTitle('Local sources'));
  expect(screen.getByText('Housing Authority')).toBeInTheDocument();
});

test('sonar citations panel shows title and date on globe button click', () => {
  render(
    <SparkleHoverBadge
      onFindResources={jest.fn()}
      onAsk={jest.fn()}
      citations={[{ url: 'https://b.com', title: 'Job Board', date: '2025-03-15', source: 'sonar' }]}
    />
  );
  fireEvent.click(screen.getByTitle('Live sources'));
  expect(screen.getByText('Job Board')).toBeInTheDocument();
  expect(screen.getByText(/2025-03-15/)).toBeInTheDocument();
});

test('legacy string citation treated as local — shows database button', () => {
  render(
    <SparkleHoverBadge
      onFindResources={jest.fn()}
      onAsk={jest.fn()}
      citations={['https://old.com']}
    />
  );
  expect(screen.getByTitle('Local sources')).toBeInTheDocument();
  expect(screen.queryByTitle('Live sources')).not.toBeInTheDocument();
});

test('clicking open panel again closes it', () => {
  render(
    <SparkleHoverBadge
      onFindResources={jest.fn()}
      onAsk={jest.fn()}
      citations={[{ url: 'https://a.com', title: 'Site A', date: null, source: 'local' }]}
    />
  );
  fireEvent.click(screen.getByTitle('Local sources'));
  expect(screen.getByText('Site A')).toBeInTheDocument();
  fireEvent.click(screen.getByTitle('Local sources'));
  expect(screen.queryByText('Site A')).not.toBeInTheDocument();
});
