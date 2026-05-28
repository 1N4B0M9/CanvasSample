import { render, screen, fireEvent } from '@testing-library/react';
import { FullConnection, Arrow } from '../ConnectionElement';

// fake elements so calculateConnectionPoints has something to work with
const elements = [
  { id: 'a', x: 0, y: 0, width: 100, height: 50, scale: 1, rotation: 0 },
  { id: 'b', x: 300, y: 300, width: 100, height: 50, scale: 1, rotation: 0 },
];

const conn = {
  id: 'c1',
  startId: 'a',
  endId: 'b',
  color: 'black',
  thickness: 2,
};

test('FullConnection: shows label text when label is set and not selected', () => {
  render(
    <svg>
      <FullConnection
        connection={{ ...conn, label: 'Step 1' }}
        elements={elements}
        isSelected={false}
        onSelect={jest.fn()}
        onDelete={jest.fn()}
        onLabelChange={jest.fn()}
      />
    </svg>,
  );
  expect(screen.getByText('Step 1')).toBeInTheDocument();
});

test('FullConnection: shows input when selected', () => {
  render(
    <svg>
      <FullConnection
        connection={conn}
        elements={elements}
        isSelected
        onSelect={jest.fn()}
        onDelete={jest.fn()}
        onLabelChange={jest.fn()}
      />
    </svg>,
  );
  expect(screen.getByPlaceholderText('add label...')).toBeInTheDocument();
});

test('FullConnection: calls onLabelChange with trimmed value on blur', () => {
  const onLabelChange = jest.fn();
  render(
    <svg>
      <FullConnection
        connection={conn}
        elements={elements}
        isSelected
        onSelect={jest.fn()}
        onDelete={jest.fn()}
        onLabelChange={onLabelChange}
      />
    </svg>,
  );
  const input = screen.getByPlaceholderText('add label...');
  fireEvent.change(input, { target: { value: '  relates to  ' } });
  fireEvent.blur(input);
  expect(onLabelChange).toHaveBeenCalledWith('c1', 'relates to');
});

test('Arrow: shows label text when label is set and not selected', () => {
  render(
    <svg>
      <Arrow
        connection={{ ...conn, label: 'causes' }}
        elements={elements}
        isSelected={false}
        onSelect={jest.fn()}
        onDelete={jest.fn()}
        onLabelChange={jest.fn()}
      />
    </svg>,
  );
  expect(screen.getByText('causes')).toBeInTheDocument();
});

test('Arrow: calls onLabelChange with undefined when input is cleared', () => {
  const onLabelChange = jest.fn();
  render(
    <svg>
      <Arrow
        connection={{ ...conn, label: 'old' }}
        elements={elements}
        isSelected
        onSelect={jest.fn()}
        onDelete={jest.fn()}
        onLabelChange={onLabelChange}
      />
    </svg>,
  );
  const input = screen.getByPlaceholderText('add label...');
  fireEvent.change(input, { target: { value: '   ' } });
  fireEvent.blur(input);
  expect(onLabelChange).toHaveBeenCalledWith('c1', undefined);
});
