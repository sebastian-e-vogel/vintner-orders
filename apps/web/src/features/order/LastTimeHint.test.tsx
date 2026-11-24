import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { winesFixture } from './testData';
import { LastTimeHint } from './LastTimeHint';

it('names the wine and the quantity, and fills the quantity on click', async () => {
  const onUse = vi.fn();
  render(<LastTimeHint wine={winesFixture[2]} quantity={12} onUse={onUse} />);
  const button = screen.getByRole('button', {
    name: 'Last time: 12 for Domaine Aubert Pinot Noir Reserve 2022, 750 ml',
  });
  await userEvent.click(button);
  expect(onUse).toHaveBeenCalledWith('wine_03', '12');
});
