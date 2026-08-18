import { el } from './dom';

export type Countdown = {
  node: HTMLElement;
  stop: () => void;
};

const DIGITS = '0123456789';
const URGENT_THRESHOLD_SEC = 300;

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

type Digit = { node: HTMLElement; set: (char: string) => void };

function createDigit(): Digit {
  const node = el('span', 'rush-roll-digit');
  const strip = el('span', 'rush-roll-strip');

  for (const digit of DIGITS) strip.appendChild(el('span', 'rush-roll-cell', digit));
  node.appendChild(strip);

  const set = (char: string) => {
    const next = DIGITS.indexOf(char);
    if (next >= 0) strip.style.setProperty('--rush-roll', String(next));
  };

  return { node, set };
}

type Cell = { node: HTMLElement; set: (value: string) => void; setUnit: (unit: string) => void };

const DAY_UNITS = ['gün', 'sa', 'dk'];
const HOUR_UNITS = ['sa', 'dk', 'sn'];

function createCell(): Cell {
  const slot = el('span', 'rush-countdown-slot');
  const node = el('span', 'rush-cell');
  const roll = el('span', 'rush-roll');
  const digits = [createDigit(), createDigit()];

  for (const digit of digits) roll.appendChild(digit.node);
  node.appendChild(roll);

  const unit = el('span', 'rush-countdown-unit');
  slot.appendChild(node);
  slot.appendChild(unit);

  const set = (value: string) => {
    digits[0].set(value[0]);
    digits[1].set(value[1]);
  };

  const setUnit = (next: string) => {
    if (unit.textContent !== next) unit.textContent = next;
  };

  return { node: slot, set, setUnit };
}

export function createCountdown(endsAt: number, label: string, onEnd: () => void): Countdown {
  const node = el('div', 'rush-countdown');
  node.setAttribute('data-urgent', 'false');
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
  let urgent = false;

  const tick = () => {
    const remaining = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));

    if (remaining !== lastRendered) {
      lastRendered = remaining;

      const nextUrgent = remaining > 0 && remaining <= URGENT_THRESHOLD_SEC;
      if (nextUrgent !== urgent) {
        urgent = nextUrgent;
        node.setAttribute('data-urgent', urgent ? 'true' : 'false');
      }

      const days = Math.floor(remaining / 86400);
      const units = days >= 1 ? DAY_UNITS : HOUR_UNITS;
      first.setUnit(units[0]);
      second.setUnit(units[1]);
      third.setUnit(units[2]);

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
