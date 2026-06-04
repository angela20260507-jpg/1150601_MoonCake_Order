/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Users, ShoppingBag, DollarSign } from 'lucide-react';
import { Order } from '../types';

interface StatisticsProps {
  orders: Order[];
}

export default function Statistics({ orders }: StatisticsProps) {
  // Core calculations
  const totalAmount = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const totalCount = orders
    .filter(order => {
      const name = order.mooncakes || (order as any).drink || "";
      return !name.startsWith("運費");
    })
    .reduce((sum, order) => sum + (order.quantity || 0), 0);
  const totalOrdersCount = Array.from(new Set(orders.map(o => o.name.trim()).filter(Boolean))).length;

  return (
    <div className="space-y-6">
      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Money */}
        <div className="bg-white rounded-2xl p-6 border border-natural-border shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
          <div className="p-3 bg-natural-terracotta/10 text-natural-terracotta rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="sans text-[11px] font-bold text-[#5A5A40] block mb-1 uppercase tracking-wider">當日訂購總金額</span>
            <span className="serif text-2xl font-black text-[#2C2C2C] tracking-tight flex items-baseline">
              <span className="text-sm font-bold mr-0.5">$</span>
              {totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Total Quantity */}
        <div className="bg-white rounded-2xl p-6 border border-natural-border shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
          <div className="p-3 bg-natural-accent/10 text-natural-accent rounded-xl">
            <ShoppingBag size={24} />
          </div>
          <div>
            <span className="sans text-[11px] font-bold text-[#5A5A40] block mb-1 uppercase tracking-wider">訂購月餅總盒數</span>
            <span className="serif text-2xl font-black text-[#2C2C2C] tracking-tight">
              {totalCount.toLocaleString()} <span className="text-xs font-bold text-slate-400 ml-0.5">盒</span>
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-6 border border-natural-border shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
          <div className="p-3 bg-natural-accent/10 text-natural-accent rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <span className="sans text-[11px] font-bold text-[#5A5A40] block mb-1 uppercase tracking-wider">參與訂購總人數</span>
            <span className="serif text-2xl font-black text-[#2C2C2C] tracking-tight">
              {totalOrdersCount.toLocaleString()} <span className="text-xs font-bold text-slate-400 ml-0.5">人</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

