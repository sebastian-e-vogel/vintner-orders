// Stable ref callbacks: React runs them only on mount and unmount.
export function focusOnMount(element: HTMLElement | null) {
  element?.focus();
}

// Opens a dialog as a modal on mount. Closing on unmount puts focus back on the
// element that had it before the dialog opened.
export function openModal(dialog: HTMLDialogElement | null) {
  if (!dialog) return;
  dialog.showModal();
  // Children mount before the dialog is open, so their own focus attempt is too early.
  dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  return () => dialog.close();
}
