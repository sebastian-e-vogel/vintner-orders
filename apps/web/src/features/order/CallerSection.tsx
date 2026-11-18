import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { UsualContact } from './UsualContact';
import type { CallerErrors } from './callerValidation';
import type { Customer } from './customer';

type CallerSectionProps = {
  customers: Customer[];
  customerId: string;
  name: string;
  phone: string;
  errors: CallerErrors;
  onCustomerChange: (customerId: string) => void;
  onNameChange: (name: string) => void;
  onPhoneChange: (phone: string) => void;
};

export function CallerSection({
  customers,
  customerId,
  name,
  phone,
  errors,
  onCustomerChange,
  onNameChange,
  onPhoneChange,
}: CallerSectionProps) {
  const customer = customers.find(({ id }) => id === customerId);

  return (
    <section
      aria-labelledby="caller-heading"
      className="mt-6 flex max-w-[60rem] flex-col gap-5 rounded-md border border-border bg-surface p-6"
    >
      <h2
        id="caller-heading"
        className="flex items-center gap-3 text-lg font-medium"
      >
        <span
          aria-hidden="true"
          className="grid size-6 place-items-center rounded-full bg-primary text-sm text-primary-foreground"
        >
          1
        </span>
        Who&apos;s calling?
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Field id="caller-customer" label="Customer" error={errors.customer}>
          {(controlProps) => (
            <Select
              {...controlProps}
              value={customerId}
              onChange={(event) => onCustomerChange(event.target.value)}
            >
              <option value="">Choose a customer…</option>
              {customers.map(({ id, companyName }) => (
                <option key={id} value={id}>
                  {companyName}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="caller-name" label="Caller name" error={errors.name}>
          {(controlProps) => (
            <Input
              {...controlProps}
              type="text"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
            />
          )}
        </Field>
        <Field
          id="caller-phone"
          label="Caller phone"
          help="Digits, spaces and hyphens, with an optional + at the start. At least 7 digits."
          error={errors.phone}
        >
          {(controlProps) => (
            <Input
              {...controlProps}
              type="tel"
              value={phone}
              onChange={(event) => onPhoneChange(event.target.value)}
            />
          )}
        </Field>
      </div>
      {customer && (
        <UsualContact
          name={customer.contactName}
          phone={customer.phone}
          isInUse={name === customer.contactName && phone === customer.phone}
          onUse={() => {
            onNameChange(customer.contactName);
            onPhoneChange(customer.phone);
          }}
        />
      )}
    </section>
  );
}
