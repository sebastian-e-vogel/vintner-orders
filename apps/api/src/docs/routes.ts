import { customersDocs } from '../customers/customers.docs.js';
import { healthDocs } from '../health.docs.js';
import { orderRequestsDocs } from '../order-requests/order-requests.docs.js';
import { settingsDocs } from '../settings/settings.docs.js';
import { winesDocs } from '../wines/wines.docs.js';

// A new endpoint adds its docs file here; the routes test fails until it does.
export const routeDocs = [
  ...healthDocs,
  ...winesDocs,
  ...customersDocs,
  ...settingsDocs,
  ...orderRequestsDocs,
];
