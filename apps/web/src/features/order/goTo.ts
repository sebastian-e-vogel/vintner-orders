// A pending "go to this wine" request. A new token for every request lets the
// same wine be picked twice in a row.
export type GoTo = {
  wineId: string;
  // Rows to highlight: the target, plus the others an "Add all" touched.
  highlightIds: string[];
  token: number;
};

export function focusQuantity(input: HTMLInputElement) {
  const prefersReducedMotion = window.matchMedia?.(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  input.focus({ preventScroll: true });
  input.select();
  input.scrollIntoView({
    block: 'center',
    behavior: prefersReducedMotion ? 'instant' : 'smooth',
  });
}
