'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { CallerSection } from './CallerSection';
import type { Customer } from './customer';
import { WineSection } from './WineSection';
import type { Wine } from './wine';

type NewOrderDraftProps = {
  customers: Customer[];
  customerId: string;
  wines: Wine[];
  policy: InventoryPolicy;
};

// Temporarily owns the whole draft: the caller and the request lines (wine id -> quantity text).
// Lines are not kept across a refresh yet; the review-and-save flow decides how the draft survives.
export function NewOrderDraft({
  customers,
  customerId,
  wines,
  policy,
}: NewOrderDraftProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [lines, setLines] = useState<Record<string, string>>({});

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
    <>
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
      <WineSection
        wines={wines}
        lines={lines}
        policy={policy}
        onQuantityChange={(wineId, text) =>
          setLines((current) => ({ ...current, [wineId]: text }))
        }
      />
    </>
  );
}
