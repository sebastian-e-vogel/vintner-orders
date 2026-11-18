'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CallerSection } from './CallerSection';
import type { Customer } from './customer';

type NewOrderCallerProps = {
  customers: Customer[];
  customerId: string;
};

// Temporary owner of the caller draft; the draft and save tickets will replace it.
export function NewOrderCaller({ customers, customerId }: NewOrderCallerProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  function handleCustomerChange(nextId: string) {
    const previous = customers.find(({ id }) => id === customerId);
    if (previous?.contactName === name && previous.phone === phone) {
      setName('');
      setPhone('');
    }
    router.replace(nextId ? `/?customer=${encodeURIComponent(nextId)}` : '/', {
      scroll: false,
    });
  }

  return (
    <CallerSection
      customers={customers}
      customerId={customerId}
      name={name}
      phone={phone}
      errors={{}}
      onCustomerChange={handleCustomerChange}
      onNameChange={setName}
      onPhoneChange={setPhone}
    />
  );
}
