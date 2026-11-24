import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { UsualContact } from './UsualContact';
import type { CallerErrors } from './callerValidation';
import type { Customer } from '@vintner/contracts';

type CallerSectionProps = {
  customers: Customer[];
  customerId: string;
  name: string;
  phone: string;
  errors: CallerErrors;
  customerRef?: React.Ref<HTMLSelectElement>;
  nameRef?: React.Ref<HTMLInputElement>;
  phoneRef?: React.Ref<HTMLInputElement>;
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
  customerRef,
  nameRef,
  phoneRef,
  onCustomerChange,
  onNameChange,
  onPhoneChange,
}: CallerSectionProps) {
  const customer = customers.find(({ id }) => id === customerId);
  const hasCustomers = customers.length > 0;

  return (
    <section
      aria-labelledby="caller-heading"
      className="mt-6 flex flex-col gap-5 rounded-md border border-border bg-surface p-6"
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
        <Field
          id="caller-customer"
          label="Customer"
          help={
            hasCustomers
              ? undefined
              : 'There are no customers yet, so an order request cannot be taken.'
          }
          error={errors.customer}
        >
          {(controlProps) => (
            <Select
              {...controlProps}
              ref={customerRef}
              value={customerId}
              disabled={!hasCustomers}
              onChange={(event) => onCustomerChange(event.target.value)}
            >
              <option value="">
                {hasCustomers ? 'Choose a customer…' : 'No customers available'}
              </option>
              {customers.map(({ id, name }) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="caller-name" label="Caller name" error={errors.name}>
          {(controlProps) => (
            <Input
              {...controlProps}
              ref={nameRef}
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
              ref={phoneRef}
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
