import { el } from './dom';

export type Countdown = {
  node: HTMLElement;
  stop: () => void;
};

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function createCountdown(endsAt: number, label: string, onEnd: () => void): Countdown {
  const node = el('div', 'rush-countdown');
  node.appendChild(el('span', 'rush-countdown-label', label));

  const cells = el('div', 'rush-countdown-cells');
  const first = el('span', 'rush-cell', '--');
  const second = el('span', 'rush-cell', '--');
  const third = el('span', 'rush-cell', '--');
  cells.appendChild(first);
  cells.appendChild(second);
  cells.appendChild(third);
  node.appendChild(cells);

  let frame = 0;
  let lastRendered = -1;
  let ended = false;

  const tick = () => {
    const remaining = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));

    if (remaining !== lastRendered) {
      lastRendered = remaining;
      const days = Math.floor(remaining / 86400);
      if (days >= 1) {
        first.textContent = pad(days);
        second.textContent = pad(Math.floor((remaining % 86400) / 3600));
        third.textContent = pad(Math.floor((remaining % 3600) / 60));
      } else {
        first.textContent = pad(Math.floor(remaining / 3600));
        second.textContent = pad(Math.floor((remaining % 3600) / 60));
        third.textContent = pad(remaining % 60);
      }
    }

    if (remaining <= 0) {
      if (!ended) {
        ended = true;
        onEnd();
      }
      return;
    }

    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);

  return {
    node,
    stop: () => cancelAnimationFrame(frame),
  };
}
