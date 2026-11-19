import {
  inventoryPolicyResponseSchema,
  saveOrderRequestInvalidSchema,
  updateInventoryPolicyRequestSchema,
} from '@vintner/contracts';
import { invalidRequestResponse, route } from '../docs/route.js';

const policyResponse = {
  200: { description: 'Policy', schema: inventoryPolicyResponseSchema },
};

export const settingsDocs = [
  route({
    method: 'get',
    path: '/settings/inventory-policy',
    summary: 'Get the inventory policy',
    responses: policyResponse,
  }),
  route({
    method: 'put',
    path: '/settings/inventory-policy',
    summary: 'Set the inventory policy',
    request: { body: updateInventoryPolicyRequestSchema },
    responses: {
      ...policyResponse,
      ...invalidRequestResponse(saveOrderRequestInvalidSchema),
    },
  }),
];
