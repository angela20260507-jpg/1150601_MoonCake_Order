/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, Trash2, Edit2, FileSpreadsheet, User, Clock, 
  Copy, Check, Moon, CreditCard, ChevronRight, AlertCircle, RefreshCw 
} from 'lucide-react';
import { Order, Mooncake } from '../types';
import { getMooncakeImage } from '../data/mockData';

interface OrderListProps {
  orders: Order[];
  menu: Mooncake[];
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => Promise<void>;
  isLoading: boolean;
  gasUrl: string;
  onRefresh: () => Promise<void>;
}

export default function OrderList({
  orders,
  menu,
  onEdit,
  onDelete,
  isLoading,
  gasUrl,
  onRefresh
}: OrderListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFlavour, setFilterFlavour] = useState("all");
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Helper to find the dynamic menu item's custom sheet imageUrl or description
  const getOrderItemImage = (mooncakesName: string) => {
    const flavor = (mooncakesName || "廣式蓮蓉月餅").trim().toLowerCase();
    const matchedItem = menu.find(item => (item.name || "").trim().toLowerCase() === flavor);
    if (matchedItem) {
      return getMooncakeImage(matchedItem);
    }
    return getMooncakeImage({ name: mooncakesName });
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const flavourName = order.mooncakes || "廣式蓮蓉月餅";
    const matchesSearch = 
      order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flavourName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFlavour = filterFlavour === 'all' || flavourName === filterFlavour;

    return matchesSearch && matchesFlavour;
  });

  // Extract distinct flavors ordered to build filter list
  const uniqueFlavours = Array.from(new Set(orders.map(o => o.mooncakes || "廣式蓮蓉月餅")));

  // Format date helper
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '剛才';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '剛才';
      return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '剛才';
    }
  };

  // Convert orders to raw CSV table style for Excel copy-pasting
  const copyToExcelFormat = () => {
    if (orders.length === 0) return;
    
    const headers = ["訂單編號", "時間戳記", "訂購人", "月餅口味", "數量", "總金額"];
    const rows = orders.map(order => [
      order.orderId,
      order.timestamp ? new Date(order.timestamp).toLocaleString('zh-TW') : new Date().toLocaleString('zh-TW'),
      order.name,
      order.mooncakes,
      order.quantity,
      order.totalPrice
    ]);

    const csvContent = [headers.join("\t"), ...rows.map(row => row.join("\t"))].join("\n");
    navigator.clipboard.writeText(csvContent);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  const handleDeleteTrigger = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    setDeleteConfirmId(orderId);
  };

  const handleConfirmDelete = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    await onDelete(orderId);
    setDeleteConfirmId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md p-6 border border-natural-border transition-all duration-300">
      {/* List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="serif text-xl font-bold text-[#3E3E3E] flex items-center gap-2">
            <span className="text-xl">📋</span>
            當日訂購點單細目
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            訂購人填妥送出的點單即時匯整於此。您可以對其進行搜尋、編輯或是從試算表中剔除。
          </p>
        </div>

        <div className="flex items-center gap-2">
          {gasUrl && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="重新整理雲端試算表"
              className="p-2.5 bg-[#FDFBF7] border border-natural-border text-[#5A5A40] rounded-xl hover:bg-[#F9F6F0] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              同步雲端
            </button>
          )}

          <button
            onClick={copyToExcelFormat}
            disabled={orders.length === 0}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-sm ${
              copiedCsv 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-[#FDFBF7] border-natural-border hover:bg-[#F9F6F0] text-natural-accent'
            } disabled:opacity-50 disabled:shadow-none`}
          >
            {copiedCsv ? <Check size={14} className="text-emerald-600" /> : <FileSpreadsheet size={14} className="text-natural-terracotta" />}
            {copiedCsv ? '已複製 Excel 格式！' : '複製為 Excel 格式 (Tab鍵分隔)'}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
        {/* Search bar */}
        <div className="relative md:col-span-8">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="點此搜尋同仁姓名、月餅口味..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-terracotta text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all"
          />
        </div>

        {/* Flavour filter */}
        <div className="relative md:col-span-4">
          <select
            value={filterFlavour}
            onChange={(e) => setFilterFlavour(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-terracotta text-xs font-semibold text-slate-700 appearance-none"
          >
            <option value="all">🔍 過濾所有口味 ({orders.length})</option>
            {uniqueFlavours.map(f => (
              <option key={f} value={f}>🥮 限顯示：{f}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
            <span className="text-[10px]">▼</span>
          </div>
        </div>
      </div>

      {/* Main Listing View */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-natural-terracotta border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500 font-serif">正在與 Google 試算表同步訂單中 ...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center text-slate-450 flex flex-col items-center justify-center gap-2">
          <div className="p-4 bg-natural-header border border-natural-border/40 text-natural-accent rounded-2xl">
            <Search size={32} />
          </div>
          <p className="serif text-sm font-bold text-[#5A5A40]">
            {searchQuery || filterFlavour !== 'all' ? '找不到符合搜尋條件的訂單' : '今天尚未有同仁遞交訂單喔！'}
          </p>
          <p className="text-xs text-slate-405">
            {searchQuery || filterFlavour !== 'all' ? '請嘗試清除關鍵字或口味過濾條件。' : '點擊上方填寫月餅點單，提交今日第一筆訂單！'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-natural-border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-natural-header border-b border-natural-border text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider">
                  <th className="py-3 px-4">訂購人與時間</th>
                  <th className="py-3 px-4">訂購月餅口味</th>
                  <th className="py-3 px-4 text-center">數量 (盒)</th>
                  <th className="py-3 px-4 text-right">小計</th>
                  <th className="py-3 px-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-border text-xs text-slate-700">
                {filteredOrders.map((order) => {
                  const isDeleting = deleteConfirmId === order.orderId;
                  
                  return (
                    <tr 
                      key={order.orderId} 
                      className="hover:bg-[#F9F6F0]/40 transition-colors"
                    >
                      {/* Name & Time */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-[#2C2C2C] flex items-center gap-1.5">
                          <User size={13} className="text-[#5A5A40]" />
                          {order.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                          <Clock size={11} />
                          {formatTime(order.timestamp)}
                        </div>
                      </td>

                      {/* Flavor */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-natural-border shrink-0 select-none shadow-xs">
                            <img 
                              src={getOrderItemImage(order.mooncakes || "廣式蓮蓉月餅")} 
                              alt={order.mooncakes || "月餅"}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=400';
                              }}
                            />
                          </div>
                          <div>
                            <span className="font-serif font-bold text-[#2C2C2C] block">
                              {order.mooncakes || "廣式蓮蓉月餅"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-4 text-center font-serif font-bold text-[#2C2C2C]">
                        {order.quantity}
                      </td>

                      {/* Subtotal */}
                      <td className="py-4 px-4 text-right font-serif font-bold text-natural-terracotta">
                        ${order.totalPrice}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center">
                        {isDeleting ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => handleConfirmDelete(e, order.orderId)}
                              className="px-2.5 py-1 bg-natural-terracotta hover:opacity-90 text-[10px] font-bold text-white rounded-md cursor-pointer transition-all"
                            >
                              確刪
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-650 rounded-md cursor-pointer transition-all"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => onEdit(order)}
                              className="text-natural-accent hover:bg-natural-accent/10 rounded-lg p-1.5 cursor-pointer"
                              title="修改此筆訂單"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteTrigger(e, order.orderId)}
                              className="text-natural-terracotta hover:bg-natural-terracotta/10 rounded-lg p-1.5 cursor-pointer"
                              title="刪除此筆訂單"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (less than lg breakpoint) */}
          <div className="lg:hidden space-y-3">
            {filteredOrders.map((order) => {
              const isDeleting = deleteConfirmId === order.orderId;
              
              return (
                <div 
                  key={order.orderId}
                  className="bg-[#F9F6F0]/20 border border-natural-border rounded-xl p-4.5 space-y-3 hover:bg-[#F9F6F0]/40 transition-all duration-350"
                >
                  {/* Top line: Name/Timestamp and Actions */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-[#2C2C2C] text-sm flex items-center gap-1.5">
                        <User size={14} className="text-[#5A5A40]" />
                        {order.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1">
                        <Clock size={11} />
                        {formatTime(order.timestamp)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDeleting ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleConfirmDelete(e, order.orderId)}
                            className="px-2 py-1 bg-natural-terracotta font-bold text-[10px] text-white rounded-lg cursor-pointer"
                          >
                            確定刪除
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                            className="px-2 py-1 bg-slate-200 font-bold text-[10px] text-slate-650 rounded-lg cursor-pointer"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => onEdit(order)}
                            className="p-2 text-natural-accent bg-white hover:bg-slate-50 rounded-xl border border-natural-border transition-colors cursor-pointer"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteTrigger(e, order.orderId)}
                            className="p-2 text-natural-terracotta bg-white hover:bg-slate-50 rounded-xl border border-natural-border transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Taste Flavour description */}
                  <div className="text-xs bg-white rounded-xl border border-natural-border p-3 flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-100 border border-natural-border shrink-0 select-none shadow-xs">
                      <img 
                        src={getOrderItemImage(order.mooncakes || "廣式蓮蓉月餅")} 
                        alt={order.mooncakes || "月餅"}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=400';
                        }}
                      />
                    </div>
                    <div>
                      <span className="font-serif font-bold text-[#2C2C2C] block text-[13.5px]">
                        {order.mooncakes || "廣式蓮蓉月餅"}
                      </span>
                    </div>
                  </div>

                  {/* Quantitative pricing */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-dashed border-natural-border">
                    <div className="text-gray-400 font-semibold font-mono text-[10px]">
                      單價：${menu.find(m => m.name === order.mooncakes)?.price || 0} / 盒
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-slate-500 font-mono font-medium">共 {order.quantity} 盒</span>
                      <span className="text-base font-black text-natural-terracotta font-serif">
                        ${order.totalPrice}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Export text tips */}
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold leading-relaxed">
            <AlertCircle size={12} className="shrink-0" />
            <span>貼心提示：點擊「複製為 Excel 格式」會將點單轉為 Tab 表格格式複製到剪貼簿，直接在空白的 Excel、Google 試算表或 Numbers 按 <b>Ctrl+V（Cmd+V）</b> 貼上即可秒速成表！</span>
          </div>
        </>
      )}
    </div>
  );
}
