import { apiFetch } from "./apiClient";

let timer: ReturnType<typeof setTimeout> | null = null;
let pending: { videoId: string; seconds: number; completed: boolean } | null =
  null;

async function flush(): Promise<void> {
  if (!pending) return;
  const { videoId, seconds, completed } = pending;
  pending = null;

  try {
    await apiFetch(`/progress/videos/${videoId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        last_position_seconds: Math.floor(Math.max(0, seconds)),
        is_completed: completed,
      }),
    });
  } catch {
    /* swallow network errors during progress saves */
  }
}

export function sendProgress(
  videoId: string,
  seconds: number,
  completed: boolean = false
): void {
  pending = { videoId, seconds, completed };

  if (completed) {
    if (timer) clearTimeout(timer);
    timer = null;
    flush();
    return;
  }

  if (!timer) {
    timer = setTimeout(() => {
      timer = null;
      flush();
    }, 5000);
  }
}

export async function sendProgressAndWait(
  videoId: string,
  seconds: number,
  completed: boolean = false
): Promise<void> {
  pending = { videoId, seconds, completed };
  if (timer) clearTimeout(timer);
  timer = null;
  await flush();
}

export function flushProgress() {
  if (timer) clearTimeout(timer);
  timer = null;
  flush();
}
