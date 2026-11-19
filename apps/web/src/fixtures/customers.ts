// TEMPORARY: replaced by the API in the wiring ticket.
import type { Customer } from '@/features/order/customer';

// "cus_lindqvist" has no order history (for the "last time" ticket).
export const customersFixture: Customer[] = [
  {
    id: 'cus_bellavista',
    companyName: 'Bellavista Trattoria',
    contactName: 'Marco Rossi',
    phone: '+44 20 7946 0101',
    email: 'marco@bellavista.example',
  },
  {
    id: 'cus_harbour',
    companyName: 'Harbour Wine Bar',
    contactName: 'Priya Nair',
    phone: '020 7946 0202',
    email: 'priya@harbourwinebar.example',
  },
  {
    id: 'cus_lindqvist',
    companyName: 'Lindqvist & Sons Delicatessen',
    contactName: 'Erik Lindqvist',
    phone: '+46 8 123 456 78',
    email: 'erik@lindqvist.example',
  },
  {
    id: 'cus_oakroom',
    companyName: 'The Oak Room Hotel',
    contactName: 'Hannah Clarke',
    phone: '+44 161 496 0404',
    email: 'hannah@oakroom.example',
  },
];
