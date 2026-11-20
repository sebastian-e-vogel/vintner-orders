import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SettingsLoading from './loading';

describe('Settings loading state', () => {
  it('announces the loading status', () => {
    render(<SettingsLoading />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading inventory policy',
    );
  });
});
