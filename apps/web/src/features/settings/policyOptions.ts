export type InventoryPolicy = 'strict' | 'flexible';

export type PolicyOptionData = {
  value: InventoryPolicy;
  label: string;
  tagline: string;
  summary: string;
  bullets: string[];
};

export const policyOptions: PolicyOptionData[] = [
  {
    value: 'strict',
    label: 'Strict',
    tagline: 'sell only what is in stock',
    summary:
      'A request is refused when any wine is asked for in a larger quantity than is available.',
    bullets: [
      'Asking for exactly the available quantity is accepted.',
      'A wine with no stock cannot be added to a request.',
      'Lines above stock show "Over stock by N", and the rep lowers them before saving.',
    ],
  },
  {
    value: 'flexible',
    label: 'Flexible',
    tagline: 'accept the order, mark what is missing',
    summary:
      'Requests are saved even when they ask for more than is available, wines with no stock included.',
    bullets: [
      'The quantity the customer asked for is stored unchanged.',
      'Each short line shows "Short by N" to reps and reviewers.',
    ],
  },
];

export function findPolicyOption(policy: InventoryPolicy): PolicyOptionData {
  return policyOptions.find((option) => option.value === policy)!;
}
