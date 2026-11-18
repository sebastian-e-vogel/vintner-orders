export type CallerValues = {
  customerId: string;
  name: string;
  phone: string;
};

export type CallerErrors = Partial<
  Record<'customer' | 'name' | 'phone', string>
>;

const PHONE_CHARACTERS = /^\+?[\d -]+$/;
const MIN_PHONE_DIGITS = 7;

function validatePhone(value: string) {
  const phone = value.trim();
  if (phone.length > 30) return 'Phone number can be at most 30 characters.';
  if (phone === '') return "Enter the caller's phone number.";
  if (!PHONE_CHARACTERS.test(phone)) {
    return 'Use only digits, spaces and hyphens, with an optional + at the start.';
  }
  if (phone.replace(/\D/g, '').length < MIN_PHONE_DIGITS) {
    return `Phone number needs at least ${MIN_PHONE_DIGITS} digits.`;
  }
}

function validateName(value: string) {
  const name = value.trim();
  if (name === '') return 'Enter the name of the person calling.';
  if (name.length > 100) return 'Name can be at most 100 characters.';
}

export function validateCaller({
  customerId,
  name,
  phone,
}: CallerValues): CallerErrors {
  const errors: CallerErrors = {
    customer: customerId === '' ? 'Choose a customer.' : undefined,
    name: validateName(name),
    phone: validatePhone(phone),
  };
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message !== undefined),
  );
}
