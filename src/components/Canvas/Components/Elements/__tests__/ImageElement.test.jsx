import { render, screen, fireEvent } from '@testing-library/react';
import ImageElement from '../ImageElement';

const base = {
  id: 'img-1',
  type: 'image',
  src: 'https://example.com/photo.jpg',
  width: 250,
  height: 150,
};

test('no label bar when label is not set', () => {
  render(<ImageElement element={base} />);
  expect(screen.queryByText(/add label/i)).not.toBeInTheDocument();
});

test('shows label text when element.label is set', () => {
  render(<ImageElement element={{ ...base, label: 'My Photo' }} />);
  expect(screen.getByText('My Photo')).toBeInTheDocument();
});

test('shows input when isEditingLabel is true', () => {
  render(
    <ImageElement
      element={base}
      isEditingLabel
      setIsEditingLabel={jest.fn()}
      onUpdate={jest.fn()}
    />,
  );
  expect(screen.getByPlaceholderText('add label...')).toBeInTheDocument();
});

test('calls onUpdate with trimmed label on blur', () => {
  const onUpdate = jest.fn();
  const setIsEditingLabel = jest.fn();
  render(
    <ImageElement
      element={base}
      isEditingLabel
      setIsEditingLabel={setIsEditingLabel}
      onUpdate={onUpdate}
    />,
  );
  const input = screen.getByPlaceholderText('add label...');
  fireEvent.change(input, { target: { value: '  cool pic  ' } });
  fireEvent.blur(input);
  expect(onUpdate).toHaveBeenCalledWith({ ...base, label: 'cool pic' });
  expect(setIsEditingLabel).toHaveBeenCalledWith(false);
});

test('calls onUpdate with undefined when label is cleared', () => {
  const onUpdate = jest.fn();
  render(
    <ImageElement
      element={{ ...base, label: 'old label' }}
      isEditingLabel
      setIsEditingLabel={jest.fn()}
      onUpdate={onUpdate}
    />,
  );
  const input = screen.getByPlaceholderText('add label...');
  fireEvent.change(input, { target: { value: '   ' } });
  fireEvent.blur(input);
  expect(onUpdate).toHaveBeenCalledWith({ ...base, label: undefined });
});
