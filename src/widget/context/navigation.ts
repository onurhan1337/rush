type Listener = (path: string) => void;

const SETTLE_DELAYS_MS = [0, 400, 1200];

const listeners: Listener[] = [];
let patched = false;
let lastPath = '';
let timers: Array<ReturnType<typeof setTimeout>> = [];

function currentPath(): string {
  return `${location.pathname}${location.search}`;
}

function notify(): void {
  const path = currentPath();
  for (let i = 0; i < listeners.length; i++) listeners[i](path);
}

function schedule(): void {
  for (let i = 0; i < timers.length; i++) clearTimeout(timers[i]);
  timers = SETTLE_DELAYS_MS.map((delay) => setTimeout(notify, delay));
}

function handleLocationChange(): void {
  const path = currentPath();
  if (path === lastPath) return;
  lastPath = path;
  schedule();
}

function patchHistory(): void {
  const history = window.history;
  const push = history.pushState;
  const replace = history.replaceState;

  history.pushState = function patchedPushState(...args: Parameters<History['pushState']>) {
    const result = push.apply(this, args);
    handleLocationChange();
    return result;
  };

  history.replaceState = function patchedReplaceState(...args: Parameters<History['replaceState']>) {
    const result = replace.apply(this, args);
    handleLocationChange();
    return result;
  };
}

export function onRouteChange(listener: Listener): void {
  listeners.push(listener);

  if (patched) return;
  patched = true;
  lastPath = currentPath();

  try {
    patchHistory();
  } catch {
    return;
  }

  window.addEventListener('popstate', handleLocationChange);
  window.addEventListener('hashchange', handleLocationChange);
  window.addEventListener('pageshow', (event) => {
    if ((event as PageTransitionEvent).persisted) schedule();
  });
}
