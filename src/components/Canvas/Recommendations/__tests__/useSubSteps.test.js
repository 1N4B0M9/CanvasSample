import { renderHook, act } from '@testing-library/react';
import useSubSteps from '../useSubSteps';

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  process.env.REACT_APP_PATHWAY_WORKER_URL = 'https://test.worker.dev';
});

test('returns steps array on success', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ steps: [{ text: 'Do this', label: 'first' }] }),
  });
  const { result } = renderHook(() => useSubSteps());
  let data;
  await act(async () => {
    data = await result.current.fetchSubSteps({ goalText: 'goal', stepText: 'step', userQuery: 'how?' });
  });
  expect(data.steps).toHaveLength(1);
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toBeNull();
});

test('POSTs to WORKER_URL/substeps with correct body', async () => {
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ steps: [] }) });
  const { result } = renderHook(() => useSubSteps());
  await act(async () => {
    await result.current.fetchSubSteps({ goalText: 'g', stepText: 's', userQuery: 'q' });
  });
  expect(global.fetch).toHaveBeenCalledWith(
    'https://test.worker.dev/substeps',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ goalText: 'g', stepText: 's', userQuery: 'q' }),
    }),
  );
});

test('sets error and returns null on non-ok response', async () => {
  global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
  const { result } = renderHook(() => useSubSteps());
  let data;
  await act(async () => {
    data = await result.current.fetchSubSteps({ goalText: 'g', stepText: 's', userQuery: 'q' });
  });
  expect(data).toBeNull();
  expect(result.current.error).toBeTruthy();
  expect(result.current.loading).toBe(false);
});

test('sets error and returns null when WORKER_URL not configured', async () => {
  process.env.REACT_APP_PATHWAY_WORKER_URL = '';
  const { result } = renderHook(() => useSubSteps());
  let data;
  await act(async () => {
    data = await result.current.fetchSubSteps({ goalText: 'g', stepText: 's', userQuery: 'q' });
  });
  expect(data).toBeNull();
  expect(result.current.error).toBeTruthy();
});
