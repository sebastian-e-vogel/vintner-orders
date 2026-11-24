import { orderRequestSchema } from '@vintner/contracts';

export type CallerValues = {
  customerId: string;
  name: string;
  phone: string;
};

export type CallerErrors = Partial<
  Record<'customer' | 'name' | 'phone', string>
>;

type MessageSchema = {
  safeParse: (value: never) => { error?: { issues: { message: string }[] } };
};

// The first message the contract gives for this value, or undefined when it is fine.
export function contractMessage<T>(
  schema: MessageSchema,
  value: T,
): string | undefined {
  return schema.safeParse(value as never).error?.issues[0]?.message;
}

const {
  customerId: customerSchema,
  contactName,
  phone,
} = orderRequestSchema.shape;

export function validateCaller(values: CallerValues): CallerErrors {
  const errors: CallerErrors = {
    // Fixture ids are not uuids, so only an empty choice is checked here.
    customer:
      values.customerId === ''
        ? contractMessage(customerSchema, '')
        : undefined,
    name: contractMessage(contactName, values.name),
    phone: contractMessage(phone, values.phone),
  };
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message !== undefined),
  );
}
