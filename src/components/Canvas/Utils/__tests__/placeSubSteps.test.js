import { placeSubSteps } from '../placeSubSteps';

const parent = { id: 'p1', x: 100, y: 100, width: 200, height: 80 };

test('places first step at parent.x+40, parent.y+height+80', () => {
  const result = placeSubSteps({
    parentElement: parent,
    steps: [{ text: 'A', label: 'first' }],
    existingElements: [],
  });
  expect(result).toHaveLength(1);
  expect(result[0].x).toBe(140);  // 100 + 40
  expect(result[0].y).toBe(260);  // 100 + 80 + 80
});

test('stacks second step below first with 100px gap', () => {
  const steps = [{ text: 'A', label: 'first' }, { text: 'B', label: 'then' }];
  const result = placeSubSteps({ parentElement: parent, steps, existingElements: [] });
  expect(result[1].y).toBe(result[0].y + 80 + 100);
});

test('propagates content from step text', () => {
  const result = placeSubSteps({
    parentElement: parent,
    steps: [{ text: 'Do the thing', label: 'first' }],
    existingElements: [],
  });
  expect(result[0].content).toBe('Do the thing');
});

test('each result has type text, rotation 0, scale 1', () => {
  const result = placeSubSteps({
    parentElement: parent,
    steps: [{ text: 'A', label: 'first' }],
    existingElements: [],
  });
  expect(result[0].type).toBe('text');
  expect(result[0].rotation).toBe(0);
  expect(result[0].scale).toBe(1);
});

test('collision: shifts y below blocker bottom + 20px', () => {
  // Blocker occupies y=250..330, which overlaps proposed first step at y=260
  const blocker = { id: 'b1', x: 130, y: 250, width: 200, height: 80 };
  const result = placeSubSteps({
    parentElement: parent,
    steps: [{ text: 'A', label: 'first' }],
    existingElements: [parent, blocker],
  });
  // blocker bottom = 250 + 80 = 330; expected y >= 330 + 20 = 350
  expect(result[0].y).toBeGreaterThanOrEqual(350);
});
