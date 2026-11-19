// TEMPORARY: replaced by the API in the wiring ticket.
// Set FAKE_NO_REQUESTS=1 (restart the server) to see the empty state.
import type { SavedRequest } from '@/features/requests/savedRequest';

const requests: SavedRequest[] = [
  {
    reference: 'REQ-1003',
    savedAt: '2026-11-17T16:45:00.000Z',
    customer: 'Harbor Street Bistro',
    usualContact: 'Marta Ruiz',
    contactName: 'Marta Ruiz',
    phone: '+1 555 0142',
    repId: 'rep-1',
    policy: 'flexible',
    note: 'Needed for a private dinner on Saturday. Please confirm what can be delivered by Friday.',
    lines: [
      {
        id: 'l1',
        producer: 'Domaine Aubert',
        wine: 'Chablis Premier Cru',
        region: 'Burgundy, France',
        vintage: 2021,
        size: '750 ml',
        requested: 12,
        availableAtSave: 5,
      },
      {
        id: 'l2',
        producer: 'Bodega Ladera',
        wine: 'Reserva Tinto',
        region: 'Rioja, Spain',
        vintage: 2018,
        size: '1.5 L',
        requested: 3,
        availableAtSave: 0,
      },
      {
        id: 'l3',
        producer: 'Tenuta Villa Rosa',
        wine: 'Chianti Classico',
        region: 'Tuscany, Italy',
        vintage: 2020,
        size: '750 ml',
        requested: 6,
        availableAtSave: 40,
      },
    ],
  },
  {
    reference: 'REQ-1002',
    savedAt: '2026-11-16T10:20:00.000Z',
    customer: 'Olive & Vine Market',
    usualContact: 'Daniel Okafor',
    contactName: 'Priya Nair',
    phone: '+1 555 0177',
    repId: 'rep-1',
    policy: 'strict',
    lines: [
      {
        id: 'l1',
        producer: 'Weingut Hessel',
        wine: 'Riesling Kabinett',
        region: 'Mosel, Germany',
        vintage: 2022,
        size: '750 ml',
        requested: 24,
        availableAtSave: 24,
      },
      {
        id: 'l2',
        producer: 'Quinta do Vale',
        wine: 'Douro Red',
        region: 'Douro, Portugal',
        vintage: 2019,
        size: '750 ml',
        requested: 6,
        availableAtSave: 18,
      },
    ],
  },
  {
    reference: 'REQ-1001',
    savedAt: '2026-11-12T13:05:00.000Z',
    customer: 'The Copper Kettle Inn',
    usualContact: 'Joseph Brandt',
    contactName: 'Joseph Brandt',
    phone: '+1 555 0108',
    repId: 'rep-1',
    policy: 'strict',
    lines: [
      {
        id: 'l1',
        producer: 'Maison Delacroix',
        wine: 'Brut Réserve',
        region: 'Champagne, France',
        vintage: 2015,
        size: '750 ml',
        requested: 8,
        availableAtSave: 14,
      },
    ],
  },
];

export function getSavedRequests(): SavedRequest[] {
  return process.env.FAKE_NO_REQUESTS === '1' ? [] : requests;
}
