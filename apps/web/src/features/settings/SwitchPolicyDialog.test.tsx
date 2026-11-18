import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SwitchPolicyDialog } from './SwitchPolicyDialog';

const renderDialog = (
  props: Partial<React.ComponentProps<typeof SwitchPolicyDialog>> = {},
) =>
  render(
    <SwitchPolicyDialog
      ref={null}
      policy="flexible"
      savedRequestCount={12}
      isPending={false}
      onConfirm={() => {}}
      onClose={() => {}}
      {...props}
    />,
  );

describe('SwitchPolicyDialog', () => {
  it.each([
    ['flexible', /can save a request that exceeds available stock/],
    ['strict', /cannot save a request that exceeds available stock/],
  ] as const)('explains switching to %s', (policy, text) => {
    renderDialog({ policy });
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it.each([
    [0, 'No requests have been saved yet, so none are affected.'],
    [1, 'The 1 request already saved keeps the policy it was saved under.'],
    [
      12,
      'The 12 requests already saved keep the policy they were saved under.',
    ],
  ])('words the saved-request note for a count of %i', (count, note) => {
    renderDialog({ savedRequestCount: count });
    expect(screen.getByText(new RegExp(note))).toBeInTheDocument();
  });
});
