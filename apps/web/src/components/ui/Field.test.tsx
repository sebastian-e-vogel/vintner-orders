import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Field } from './Field';

function renderField(props: { help?: string; error?: string }) {
  render(
    <Field id="f" label="Label" {...props}>
      {(controlProps) => <input {...controlProps} />}
    </Field>,
  );
  return screen.getByLabelText('Label');
}

describe('Field', () => {
  it('labels the control and has no description by default', () => {
    const input = renderField({});
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('links help and error, in that order', () => {
    const input = renderField({ help: 'Some help.', error: 'Some error.' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'f-help f-error');
    expect(input).toHaveAccessibleDescription('Some help. Some error.');
  });
});
