import { render, screen, fireEvent } from '@testing-library/react';
import BoardResourcesSidebar from '../BoardResourcesSidebar';
import { useCanvas } from '../../Utils/CanvasContext';

jest.mock('../../Utils/CanvasContext');

const mockSetHighlightedStepIds = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useCanvas.mockReturnValue({
    boardResources: [],
    setHighlightedStepIds: mockSetHighlightedStepIds,
  });
});

test('shows empty state when no board resources', () => {
  render(<BoardResourcesSidebar onClose={jest.fn()} />);
  expect(screen.getByText(/No resources on your board yet/)).toBeInTheDocument();
});

test('renders resource name and step count', () => {
  useCanvas.mockReturnValue({
    boardResources: [{ id: 'r1', name: 'Housing Authority', source: 'local', stepIds: ['s1', 's2'] }],
    setHighlightedStepIds: mockSetHighlightedStepIds,
  });
  render(<BoardResourcesSidebar onClose={jest.fn()} />);
  expect(screen.getByText('Housing Authority')).toBeInTheDocument();
  expect(screen.getByText('2 steps')).toBeInTheDocument();
});

test('shows Local badge for local source', () => {
  useCanvas.mockReturnValue({
    boardResources: [{ id: 'r1', name: 'Agency', source: 'local', stepIds: ['s1'] }],
    setHighlightedStepIds: mockSetHighlightedStepIds,
  });
  render(<BoardResourcesSidebar onClose={jest.fn()} />);
  expect(screen.getByText(/Local/)).toBeInTheDocument();
});

test('shows Live badge for sonar source', () => {
  useCanvas.mockReturnValue({
    boardResources: [{ id: 'r1', name: 'Sonar Agency', source: 'sonar', stepIds: ['s1'] }],
    setHighlightedStepIds: mockSetHighlightedStepIds,
  });
  render(<BoardResourcesSidebar onClose={jest.fn()} />);
  expect(screen.getByText(/Live/)).toBeInTheDocument();
});

test('calls setHighlightedStepIds with stepIds on mouse enter', () => {
  useCanvas.mockReturnValue({
    boardResources: [{ id: 'r1', name: 'Housing Authority', source: 'local', stepIds: ['s1', 's2'] }],
    setHighlightedStepIds: mockSetHighlightedStepIds,
  });
  render(<BoardResourcesSidebar onClose={jest.fn()} />);
  fireEvent.mouseEnter(screen.getAllByRole('listitem')[0]);
  expect(mockSetHighlightedStepIds).toHaveBeenCalledWith(['s1', 's2']);
});

test('calls setHighlightedStepIds with empty array on mouse leave', () => {
  useCanvas.mockReturnValue({
    boardResources: [{ id: 'r1', name: 'Housing Authority', source: 'local', stepIds: ['s1', 's2'] }],
    setHighlightedStepIds: mockSetHighlightedStepIds,
  });
  render(<BoardResourcesSidebar onClose={jest.fn()} />);
  fireEvent.mouseLeave(screen.getAllByRole('listitem')[0]);
  expect(mockSetHighlightedStepIds).toHaveBeenCalledWith([]);
});

test('calls onClose when close button clicked', () => {
  const onClose = jest.fn();
  render(<BoardResourcesSidebar onClose={onClose} />);
  fireEvent.click(screen.getByLabelText('Close'));
  expect(onClose).toHaveBeenCalledTimes(1);
});
