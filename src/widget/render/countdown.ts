import { el } from './dom';

export type Countdown = {
  node: HTMLElement;
  stop: () => void;
};

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

type Cell = { node: HTMLElement; set: (value: string) => void };

function createCell(): Cell {
  const node = el('span', 'rush-cell');
  const digits = el('span', undefined, '--');
  node.appendChild(digits);

  const set = (value: string) => {
    if (digits.textContent === value) return;
    digits.textContent = value;
    node.removeAttribute('data-tick');
    void node.offsetWidth;
    node.setAttribute('data-tick', 'true');
  };

  return { node, set };
}

export function createCountdown(endsAt: number, label: string, onEnd: () => void): Countdown {
  const node = el('div', 'rush-countdown');
  node.appendChild(el('span', 'rush-countdown-label', label));

  const cells = el('div', 'rush-countdown-cells');
  const first = createCell();
  const second = createCell();
  const third = createCell();
  cells.appendChild(first.node);
  cells.appendChild(second.node);
  cells.appendChild(third.node);
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
        first.set(pad(days));
        second.set(pad(Math.floor((remaining % 86400) / 3600)));
        third.set(pad(Math.floor((remaining % 3600) / 60)));
      } else {
        first.set(pad(Math.floor(remaining / 3600)));
        second.set(pad(Math.floor((remaining % 3600) / 60)));
        third.set(pad(remaining % 60));
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
