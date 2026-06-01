/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Edit2, X, Plus, Minus, Check, Star } from 'lucide-react';
import { Mooncake, Order } from '../types';
import { getMooncakeImage, cleanDescription } from '../data/mockData';

interface OrderFormProps {
  menu: Mooncake[];
  onSubmit: (formData: any) => Promise<void>;
  editingOrder: Order | null;
  onCancelEdit: () => void;
  isSubmitting: boolean;
}

// Map emojis to options for customized beautiful chips
export const FILLING_EMOJIS: Record<string, string> = {
  "經典蛋黃": "🍳",
  "流心奶黃": "🍯",
  "御皇豆沙": "🫘",
  "宇治抹茶": "🍵",
  "低糖純素": "🍃"
};

export const PACKAGING_EMOJIS: Record<string, string> = {
  "單入嚐鮮": "🧁",
  "二入輕裝": "🛍️",
  "三入禮盒": "🎁",
  "六入精裝": "🍱",
  "十二入奢華": "👑"
};

export default function OrderForm({
  menu,
  onSubmit,
  editingOrder,
  onCancelEdit,
  isSubmitting
}: OrderFormProps) {
  const [name, setName] = useState("");
  const [selectedMooncakeName, setSelectedMooncakeName] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Find currently selected mooncake details
  const currentMooncake = menu.find(item => item.name === selectedMooncakeName) || menu[0] || null;

  // React to editing changes
  useEffect(() => {
    if (editingOrder) {
      setName(editingOrder.name);
      setSelectedMooncakeName(editingOrder.mooncakes);
      setQuantity(editingOrder.quantity);
    } else {
      setName("");
      if (menu.length > 0) {
        setSelectedMooncakeName(menu[0].name);
      }
      setQuantity(1);
    }
  }, [editingOrder, menu]);

  // Adjust default selection if menu becomes available
  useEffect(() => {
    if (menu.length > 0 && !selectedMooncakeName && !editingOrder) {
      setSelectedMooncakeName(menu[0].name);
    }
  }, [menu, selectedMooncakeName, editingOrder]);

  const totalPrice = currentMooncake ? currentMooncake.price * quantity : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("請填寫訂購人姓名！");
      return;
    }
    if (!selectedMooncakeName) {
      alert("請選擇月餅款式！");
      return;
    }

    const payload: any = {
      name: name.trim(),
      mooncakes: selectedMooncakeName,
      quantity,
      totalPrice
    };

    if (editingOrder) {
      payload.orderId = editingOrder.orderId;
    }

    await onSubmit(payload);

    // Only clear on successful submit if we are NOT editing
    if (!editingOrder) {
      setName("");
      setQuantity(1);
    }
  };

  return (
    <div id="order-form-container" className="bg-white rounded-2xl shadow-sm hover:shadow-md p-6 border border-natural-border transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="serif text-xl font-bold text-[#3E3E3E] flex items-center gap-2.5">
          <span className={`w-1 h-5 rounded-full ${editingOrder ? 'bg-natural-terracotta' : 'bg-natural-accent'}`} />
          {editingOrder ? "修改我的月餅訂單" : "填寫訂購單"}
        </h2>
        {editingOrder && (
          <button 
            type="button" 
            onClick={onCancelEdit}
            className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-all cursor-pointer flex items-center gap-1"
          >
            <X size={14} /> 取消修改
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name input */}
        <div>
          <label className="sans text-[11px] font-bold text-[#5A5A40] uppercase tracking-wider block mb-1">
            訂購人姓名 <span className="text-natural-terracotta">*</span>
          </label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：陳大文 (研發部)"
            className="w-full bg-white border border-natural-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-natural-terracotta outline-none text-[#2C2C2C] font-medium"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Selected Mooncake flavour */}
        <div>
          <label className="sans text-[11px] font-bold text-[#5A5A40] uppercase tracking-wider block mb-2">
            口味選擇 (請點選款式) <span className="text-natural-terracotta">*</span>
          </label>
          
          {menu.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-natural-border rounded-xl text-slate-400 text-xs text-natural-accent bg-natural-header">
              🥮 正在下載最新月餅口味與圖片...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {menu.map((item, index) => {
                const isSelected = item.name === selectedMooncakeName;
                const imgSrc = getMooncakeImage(item);
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedMooncakeName(item.name)}
                    className={`group text-left border rounded-xl overflow-hidden transition-all duration-300 flex flex-col focus:outline-none cursor-pointer ${
                      isSelected 
                        ? 'border-natural-accent bg-natural-header/40 ring-1 ring-natural-accent shadow-sm' 
                        : 'border-natural-border bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Image space with referrer-policy fallback */}
                    <div className="h-28 w-full bg-slate-100 relative overflow-hidden border-b border-natural-border flex items-center justify-center shrink-0">
                      <img 
                        src={imgSrc} 
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=400';
                        }}
                      />
                      <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full font-serif font-medium backdrop-blur-xs">
                        {item.category || "中秋禮盒"}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-natural-accent text-white rounded-full p-1 shadow-md">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    
                    {/* Content text */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif font-bold text-[13px] text-[#2C2C2C] leading-snug group-hover:text-natural-accent transition-colors">
                          {item.name}
                        </h4>
                        {(() => {
                          const displayDesc = cleanDescription(item.description);
                          return displayDesc ? (
                            <p className="text-[11px] text-slate-500 leading-relaxed mt-1 line-clamp-2">
                              {displayDesc}
                            </p>
                          ) : null;
                        })()}
                      </div>
                      
                      <div className="mt-2.5 pt-2 border-t border-natural-border flex justify-between items-baseline shrink-0">
                        <span className="text-[10px] text-slate-400 font-medium">單價</span>
                        <span className="text-sm font-bold text-natural-terracotta font-mono">
                          ${item.price} / 盒
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>



        {/* Quantity editor */}
        <div className="flex items-center justify-between pt-2 border-t border-natural-border">
          <span className="sans text-[11px] font-bold text-[#5A5A40] uppercase tracking-wider">購買數量</span>
          <div className="flex items-center gap-3 bg-natural-header rounded-full px-4 py-1 border border-natural-border">
            <button
              type="button"
              disabled={quantity <= 1 || isSubmitting}
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="text-lg font-bold text-[#5A5A40] hover:scale-110 active:scale-95 disabled:opacity-30 transition-all cursor-pointer w-6 h-6 flex items-center justify-center"
            >
              −
            </button>
            <span className="font-bold text-[#2C2C2C] text-sm w-6 text-center select-none">{quantity}</span>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setQuantity(quantity + 1)}
              className="text-lg font-bold text-[#5A5A40] hover:scale-110 active:scale-95 transition-all cursor-pointer w-6 h-6 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Price calculation and submission */}
        <div className="pt-4 border-t border-natural-border space-y-4">
          <div className="flex justify-between items-end">
            <div className="text-left">
              <span className="sans text-[11px] font-bold text-[#5A5A40] uppercase tracking-wider block mb-0.5">預估應付金額</span>
              <span className="text-[10px] text-gray-400 font-medium">({quantity} 盒 × ${currentMooncake?.price || 0})</span>
            </div>
            <span className="serif text-3xl font-black text-natural-terracotta tracking-tight flex items-baseline">
              <span className="text-lg font-bold mr-0.5">$</span>{totalPrice}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || menu.length === 0}
            className="w-full bg-natural-terracotta text-white py-3 rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {editingOrder ? '正在更新試算表...' : '正在傳送至 Google 試算表...'}
              </>
            ) : (
              <>
                {editingOrder ? <Check size={18} /> : <span>🥮</span>}
                {editingOrder ? '確認更新訂單' : '加入訂購清單'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
