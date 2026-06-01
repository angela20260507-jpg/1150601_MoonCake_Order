/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart2, Users, ShoppingBag, DollarSign, 
  Copy, Check, PieChart, FileText, ClipboardList 
} from 'lucide-react';
import { Order, Mooncake } from '../types';

interface StatisticsProps {
  orders: Order[];
  menu: Mooncake[];
}

export default function Statistics({ orders, menu }: StatisticsProps) {
  const [copiedProcurement, setCopiedProcurement] = useState(false);

  // Core calculations
  const totalAmount = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const totalCount = orders.reduce((sum, order) => sum + (order.quantity || 0), 0);
  const totalOrdersCount = orders.length;

  // Breakdown by flavour
  const flavourBreakdown: Record<string, number> = {};

  orders.forEach(order => {
    // Flavour with legacy support fallback
    const flavourName = order.mooncakes || (order as any).drink || "廣式蓮蓉月餅";
    flavourBreakdown[flavourName] = (flavourBreakdown[flavourName] || 0) + (order.quantity || 1);
  });

  // Sort breakdowns
  const sortedFlavours = Object.entries(flavourBreakdown).sort((a, b) => b[1] - a[1]);

  // Generate copyable supplier purchase order summary
  const getProcurementText = () => {
    const todayStr = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    let text = `🥮 安琪拉烘焙工作室中秋月餅訂購統計清單 (${todayStr})\n`;
    text += `=====================================\n`;
    text += `【當日點單總結】\n`;
    text += `• 訂購總金額：$${totalAmount} 元\n`;
    text += `• 訂購總盒數：共 ${totalCount} 盒\n`;
    text += `• 參與訂購人數：共 ${totalOrdersCount} 人\n\n`;

    text += `【月餅口味採購匯整】\n`;
    if (sortedFlavours.length === 0) text += `• 尚無品項點單\n`;
    sortedFlavours.forEach(([name, count]) => {
      const price = menu.find(m => m.name === name)?.price || 0;
      text += `• ${name}：${count} 盒 (金額：$${count * price} 元)\n`;
    });
    
    text += `=====================================\n`;
    text += `（本訂購單由「安琪拉烘焙工作室月餅訂購系統」自動產生）`;
    return text;
  };

  const copyProcurementList = () => {
    if (orders.length === 0) return;
    navigator.clipboard.writeText(getProcurementText());
    setCopiedProcurement(true);
    setTimeout(() => setCopiedProcurement(false), 2000);
  };

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

      {emptyState(orders) ? (
        <div className="bg-white rounded-2xl p-8 border border-natural-border text-center text-slate-450 flex flex-col items-center justify-center gap-2">
          <PieChart size={36} className="text-natural-accent/30 animate-pulse" />
          <p className="serif text-sm font-bold text-[#5A5A40]">尚無足夠點單數據，無法產生視覺化採購統計。</p>
          <p className="text-xs text-slate-400">當有同仁填寫並遞交月餅點單後，此處將自動產生彙整圖表。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Detailed Progress Breakdown Charts */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-natural-border shadow-sm space-y-6">
            <div>
              <h3 className="serif text-sm font-bold text-[#3E3E3E] flex items-center gap-2 uppercase tracking-wide mb-4">
                <BarChart2 size={16} className="text-natural-terracotta" />
                月餅款式採購比例
              </h3>
              
              <div className="space-y-3.5">
                {sortedFlavours.map(([name, count]) => {
                  const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
                  const price = menu.find(m => m.name === name)?.price || 0;
                  
                  return (
                    <div key={name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-650">
                        <span className="text-[#3E3E3E]">{name}</span>
                        <span className="font-mono text-slate-500">
                          {count} 盒 ({pct.toFixed(0)}%) · 預估售價: ${count * price}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-natural-header rounded-full overflow-hidden border border-natural-border">
                        <div 
                          className="h-full bg-natural-accent rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Copiable Procurement Summary Box */}
          <div className="lg:col-span-4 bg-natural-header rounded-2xl p-6 border border-natural-border flex flex-col justify-between shadow-sm space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-natural-accent/15 text-[#5A5A40] rounded-lg">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <h3 className="serif text-sm font-bold text-[#2C2C2C]">一鍵主辦人採購清單</h3>
                  <span className="text-[10px] text-slate-500 block">自動折合加總，方便複製發送訂貨。</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-natural-border p-3 text-[11px] leading-relaxed font-mono text-[#2C2C2C] max-h-56 overflow-y-auto select-all">
                <pre className="whitespace-pre-wrap">{getProcurementText()}</pre>
              </div>
            </div>

            <button
              type="button"
              onClick={copyProcurementList}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                copiedProcurement 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-natural-terracotta hover:opacity-90 text-white'
              }`}
            >
              {copiedProcurement ? (
                <>
                  <Check size={14} />
                  採購清單已複製！
                </>
              ) : (
                <>
                  <Copy size={14} />
                  複製一鍵採購統計
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function emptyState(orders: Order[]): boolean {
  return orders.length === 0;
}
