import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);

// jsdom has no showModal/close; this stub also emulates initial focus and Esc.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '');
  this.querySelector('button')?.focus();
  this.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const cancel = new Event('cancel', { cancelable: true });
    this.dispatchEvent(cancel);
    if (!cancel.defaultPrevented) this.close();
  });
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open');
};
