/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, Trash2, Edit2, FileSpreadsheet, User, Clock, 
  Copy, Check, Moon, CreditCard, ChevronRight, AlertCircle, RefreshCw, Calendar 
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
  const [searchDate, setSearchDate] = useState("");
  const [filterFlavour, setFilterFlavour] = useState("all");
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Helper to normalize any date string to YYYY-MM-DD
  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const cleaned = dateStr.trim();
    
    // Try split by '/' or '-'
    const parts = cleaned.split(/[-/]/);
    if (parts.length === 3) {
      const y = parts[0].trim();
      const m = parts[1].trim().padStart(2, '0');
      // Ignore possible times in the third segment if any
      const d = parts[2].trim().split(/\s|T/)[0].padStart(2, '0');
      if (y.length === 4 && !isNaN(Number(y)) && !isNaN(Number(m)) && !isNaN(Number(d))) {
        return `${y}-${m}-${d}`;
      }
    }

    // Fallback to JS standard Date parsing
    const dateObj = new Date(cleaned);
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    return cleaned;
  };

  // Helper to determine if an order is locked (delivery date is within 30 days of today, or in the past)
  const isOrderLocked = (deliveryDateStr?: string): boolean => {
    if (!deliveryDateStr) return false;
    const targetDate = new Date(normalizeDate(deliveryDateStr));
    if (isNaN(targetDate.getTime())) return false;
    
    // Set times to midnight to calculate pure day differences
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    // Locked if delivery date is less than 30 days from today
    return diffDays < 30;
  };

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
    const matchesSearchName = order.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const orderDeliveryDate = normalizeDate(order.deliveryDate || "");
    const targetSearchDate = normalizeDate(searchDate);
    const matchesSearchDate = !searchDate || orderDeliveryDate === targetSearchDate;

    return matchesSearchName && matchesSearchDate;
  });

  const hasSearched = searchQuery.trim() !== "" && searchDate !== "";

  // Extract distinct flavors ordered to build filter list
  const uniqueFlavours = Array.from(new Set(orders.map(o => o.mooncakes || (o as any).drink || "廣式蓮蓉月餅")));

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
    
    const headers = ["訂單編號", "時間戳記", "訂購人", "月餅口味", "數量", "總金額", "手機號碼", "電子信箱", "送貨地址", "送貨日期"];
    const rows = orders.map(order => [
      order.orderId,
      order.timestamp ? new Date(order.timestamp).toLocaleString('zh-TW') : new Date().toLocaleString('zh-TW'),
      order.name,
      order.mooncakes,
      order.quantity,
      order.totalPrice,
      order.phone || "",
      order.email || "",
      order.address || "",
      order.deliveryDate || ""
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
            查詢訂購人訂單明細
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            請在下方輸入訂購人姓名與送貨日，即可快速查詢對應訂單（任何時間遞交的訂單皆可查詢）。
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Name input */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <User size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="請輸入訂購人姓名以查詢..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#FCFAF6] border border-[#E4DDD3] rounded-xl outline-none text-[#2C2C2C] placeholder-slate-400 focus:bg-white focus:border-amber-700/60 focus:ring-2 focus:ring-amber-100 transition-all text-sm font-semibold hover:bg-white hover:border-slate-300"
          />
        </div>

        {/* Date input */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Calendar size={16} />
          </span>
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FCFAF6] border border-[#E4DDD3] rounded-xl outline-none text-[#2C2C2C] placeholder-slate-400 focus:bg-white focus:border-amber-700/60 focus:ring-2 focus:ring-amber-100 transition-all text-sm font-semibold hover:bg-white hover:border-slate-300 font-mono"
          />
        </div>
      </div>

      {/* Main Listing View */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-natural-terracotta border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500 font-serif">正在與 Google 試算表同步訂單中 ...</p>
        </div>
      ) : !hasSearched ? (
        <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3 bg-[#FAF8F5]/60 rounded-2xl border border-dashed border-[#E4DDD3]">
          <div className="p-3.5 bg-white border border-[#E4DDD3] text-amber-800 rounded-2xl shadow-xs">
            <Search size={22} className="text-amber-800" />
          </div>
          <p className="serif text-sm font-bold text-[#5A5A40]">
            已隱藏訂單明細
          </p>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed px-4">
            已預設隱藏全部訂購明細。請在上方同時輸入<b>「訂購人姓名」</b>與設定<b>「送貨日期」</b>，不限訂單遞交日期，即可即時查閱對應的點單明細資料！
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center text-slate-450 flex flex-col items-center justify-center gap-2">
          <div className="p-4 bg-natural-header border border-natural-border/40 text-natural-accent rounded-2xl">
            <Search size={32} />
          </div>
          <p className="serif text-sm font-bold text-[#5A5A40]">
            找不到符合搜尋條件的訂單
          </p>
          <p className="text-xs text-slate-405">
            請確認您輸入的訂購人姓名與送貨日期是否正確。
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
                  <th className="py-3 px-4">聯絡與送貨資訊</th>
                  <th className="py-3 px-4">訂購月餅口味</th>
                  <th className="py-3 px-4 text-center">數量 (盒)</th>
                  <th className="py-3 px-4 text-right">小計</th>
                  <th className="py-3 px-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-border text-xs text-slate-700">
                {filteredOrders.map((order) => {
                  const isDeleting = deleteConfirmId === order.orderId;
                  const locked = isOrderLocked(order.deliveryDate);
                  
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

                      {/* Contact & Delivery Info */}
                      <td className="py-4 px-4 max-w-[240px]">
                        <div className="space-y-1 text-slate-650">
                          {order.phone && (
                            <div className="font-semibold text-[#2C2C2C] flex items-center gap-1 font-mono text-[11px]">
                              <span className="text-slate-400 select-none">📞</span> {order.phone}
                            </div>
                          )}
                          {order.email && (
                            <div className="text-slate-500 flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-mono" title={order.email}>
                              <span className="text-slate-400 select-none">✉️</span> {order.email}
                            </div>
                          )}
                          {order.address && (
                            <div className="text-[11px] text-slate-500 font-medium leading-normal break-all" title={order.address}>
                              <span className="text-slate-400 select-none">📍</span> {order.address}
                            </div>
                          )}
                          {order.deliveryDate && (
                            <div className="text-[11px] text-amber-700 font-bold flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-amber-500 select-none">📅</span> 送貨日：{order.deliveryDate}
                              </div>
                              {locked && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-red-500 font-semibold bg-red-50 border border-red-100 rounded-md px-1.5 py-0.5 mt-1 w-fit">
                                  🔒 送貨前30天內 (已鎖定修改/刪除)
                                </span>
                              )}
                            </div>
                          )}
                          {!order.phone && !order.email && !order.address && !order.deliveryDate && (
                            <span className="text-[10px] text-slate-400 italic">無提供聯絡資訊</span>
                          )}
                        </div>
                      </td>

                      {/* Flavor */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-natural-border shrink-0 select-none shadow-xs">
                            <img 
                              src={getOrderItemImage(order.mooncakes || (order as any).drink || "廣式蓮蓉月餅")} 
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
                              {order.mooncakes || (order as any).drink || "廣式蓮蓉月餅"}
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
                              onClick={() => !locked && onEdit(order)}
                              disabled={locked}
                              className={`rounded-lg p-1.5 transition-colors ${
                                locked 
                                  ? 'text-slate-300 bg-slate-50 cursor-not-allowed opacity-50' 
                                  : 'text-natural-accent hover:bg-natural-accent/10 cursor-pointer'
                              }`}
                              title={locked ? "送貨日前30天內不開放修改" : "修改此筆訂單"}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => !locked && handleDeleteTrigger(e, order.orderId)}
                              disabled={locked}
                              className={`rounded-lg p-1.5 transition-colors ${
                                locked 
                                  ? 'text-slate-300 bg-slate-50 cursor-not-allowed opacity-50' 
                                  : 'text-natural-terracotta hover:bg-natural-terracotta/10 cursor-pointer'
                              }`}
                              title={locked ? "送貨日前30天內不開放刪除" : "刪除此筆訂單"}
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
              const locked = isOrderLocked(order.deliveryDate);
              
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
                            onClick={() => !locked && onEdit(order)}
                            disabled={locked}
                            className={`p-2 rounded-xl border transition-colors ${
                              locked 
                                ? 'text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed opacity-50' 
                                : 'text-natural-accent bg-white hover:bg-slate-50 border-natural-border cursor-pointer'
                            }`}
                            title={locked ? "送貨日前30天內不開放修改" : "修改此筆訂單"}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={(e) => !locked && handleDeleteTrigger(e, order.orderId)}
                            disabled={locked}
                            className={`p-2 rounded-xl border transition-colors ${
                              locked 
                                ? 'text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed opacity-50' 
                                : 'text-natural-terracotta bg-white hover:bg-slate-50 border-natural-border cursor-pointer'
                            }`}
                            title={locked ? "送貨日前30天內不開放刪除" : "刪除此筆訂單"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Contact details for mobile */}
                  {(order.phone || order.email || order.address || order.deliveryDate) && (
                    <div className="bg-white/80 rounded-xl border border-natural-border p-2.5 space-y-1.5 text-xs text-slate-650">
                      {order.phone && (
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold font-mono text-[11px]">
                          <span className="text-slate-400 select-none">📞</span> 手機：{order.phone}
                        </div>
                      )}
                      {order.email && (
                        <div className="flex items-center gap-1.5 text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-mono" title={order.email}>
                          <span className="text-slate-400 select-none">✉️</span> 信箱：{order.email}
                        </div>
                      )}
                      {order.address && (
                        <div className="flex items-start gap-1.5 text-[11px] text-slate-500 font-medium leading-relaxed break-all" title={order.address}>
                          <span className="text-slate-400 select-none shrink-0 mt-0.5">📍</span> 地址：{order.address}
                        </div>
                      )}
                      {order.deliveryDate && (
                        <div className="flex flex-col gap-1 text-[11px] text-amber-750 font-bold">
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-500 select-none">📅</span> 送貨日：{order.deliveryDate}
                          </div>
                          {locked && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-red-500 font-semibold bg-red-50 border border-red-100 rounded-md px-1.5 py-0.5 w-fit mt-0.5">
                              🔒 送貨前30天內 (已鎖定修改/刪除)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Taste Flavour description */}
                  <div className="text-xs bg-white rounded-xl border border-natural-border p-3 flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-100 border border-natural-border shrink-0 select-none shadow-xs">
                      <img 
                        src={getOrderItemImage(order.mooncakes || (order as any).drink || "廣式蓮蓉月餅")} 
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
                        {order.mooncakes || (order as any).drink || "廣式蓮蓉月餅"}
                      </span>
                    </div>
                  </div>

                  {/* Quantitative pricing */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-dashed border-natural-border">
                    <div className="text-gray-400 font-semibold font-mono text-[10px]">
                      單價：${menu.find(m => m.name === (order.mooncakes || (order as any).drink))?.price || 0} / 盒
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
