/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Mooncake {
  name: string;
  price: number;
  category: string;
  description: string;
  imageUrl?: string;
}

export interface Order {
  orderId: string;
  timestamp?: string | Date;
  name: string;
  mooncakes: string;   // Mooncake name, compatible with "drink"
  quantity: number;
  totalPrice: number;
}

export type ActionType = 'create' | 'update' | 'delete';

export interface GASResponse {
  menu?: Mooncake[];
  orders?: Order[];
  status?: 'success' | 'error';
  message?: string;
  orderId?: string;
}
