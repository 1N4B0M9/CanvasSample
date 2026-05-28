const STEP_WIDTH = 200;
const STEP_HEIGHT = 80;

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function placeSubSteps({ parentElement, steps, existingElements }) {
  const startX = parentElement.x + 40;
  const startY = parentElement.y + (parentElement.height ?? STEP_HEIGHT) + 80;

  const placed = [];
  let proposedY = startY;

  for (let i = 0; i < steps.length; i++) {
    if (i > 0) {
      const prev = placed[i - 1];
      proposedY = prev.y + (prev.height ?? STEP_HEIGHT) + 100;
    }

    let x = startX;
    let y = proposedY;

    const allElements = [...existingElements, ...placed];
    let attempts = 0;

    while (attempts < 3) {
      const blocker = allElements.find((el) =>
        rectsOverlap(
          x, y, STEP_WIDTH, STEP_HEIGHT,
          el.x, el.y, el.width ?? STEP_WIDTH, el.height ?? STEP_HEIGHT,
        ),
      );
      if (!blocker) break;
      y = blocker.y + (blocker.height ?? STEP_HEIGHT) + 20;
      attempts++;
    }

    if (attempts === 3) {
      x = startX + 260;
      y = startY;
    }

    placed.push({
      id: `text-substep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`,
      type: 'text',
      content: steps[i].text,
      x,
      y,
      width: STEP_WIDTH,
      height: STEP_HEIGHT,
      rotation: 0,
      scale: 1,
      fontSize: 14,
      fontFamily: 'Arial',
      color: '#111827',
    });
  }

  return placed;
}
