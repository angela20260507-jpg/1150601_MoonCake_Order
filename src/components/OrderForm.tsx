/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Edit2, X, Plus, Minus, Check, Star, Calendar, ShoppingBag, User, Phone, Mail, MapPin } from 'lucide-react';
import { Mooncake, Order, CartItem } from '../types';
import { getMooncakeImage, cleanDescription } from '../data/mockData';

interface OrderFormProps {
  menu: Mooncake[];
  onSubmit: (formData: any) => Promise<void>;
  editingOrder: Order | null;
  onCancelEdit: () => void;
  isSubmitting: boolean;
}

export default function OrderForm({
  menu,
  onSubmit,
  editingOrder,
  onCancelEdit,
  isSubmitting
}: OrderFormProps) {
  // A. Checkout Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [shippingMethod, setShippingMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [shippingTemp, setShippingTemp] = useState<'room' | 'refrigerated'>('room');

  // B. Product selection fields (for adding to cart, or for immediate editing if in editMode)
  const [selectedMooncakeName, setSelectedMooncakeName] = useState("");
  const [quantity, setQuantity] = useState(1);

  // C. Shopping Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    const cached = localStorage.getItem('angela_order_cart');
    return cached ? JSON.parse(cached) : [];
  });

  // Track cart changes and persist in localStorage
  useEffect(() => {
    localStorage.setItem('angela_order_cart', JSON.stringify(cart));
  }, [cart]);

  // Find currently selected mooncake details
  const currentMooncake = menu.find(item => item.name === selectedMooncakeName) || menu[0] || null;

  // React to editing changes (Direct edit row mode)
  useEffect(() => {
    if (editingOrder) {
      setName(editingOrder.name);
      setSelectedMooncakeName(editingOrder.mooncakes);
      setQuantity(editingOrder.quantity);
      setPhone(editingOrder.phone || "");
      setEmail(editingOrder.email || "");
      setAddress(editingOrder.address || "");
      setDeliveryDate(editingOrder.deliveryDate || "");
    } else {
      // Keep name and contact details if already filled, only reset selected items
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

  const unitPrice = currentMooncake ? currentMooncake.price : 0;
  const itemTotalPrice = unitPrice * quantity;

  // Calculate cart metrics
  const cartTotalAmount = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const shippingFee = shippingMethod === 'pickup'
    ? 0
    : (cartTotalAmount >= 3800 ? 0 : (shippingTemp === 'refrigerated' ? 450 : 200));
  const totalAmountWithShipping = cartTotalAmount + shippingFee;

  // Add Item to Shopping Cart
  const handleAddToCart = () => {
    if (!selectedMooncakeName) {
      alert("請先點選想要選購的月餅款式！");
      return;
    }

    const price = currentMooncake?.price || 0;
    
    setCart(prevCart => {
      const existingIdx = prevCart.findIndex(item => item.mooncakeName === selectedMooncakeName);
      if (existingIdx !== -1) {
        // Increment quantity of existing item
        const updated = [...prevCart];
        updated[existingIdx].quantity += quantity;
        return updated;
      } else {
        // Add new item
        return [...prevCart, {
          id: `cart-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          mooncakeName: selectedMooncakeName,
          quantity: quantity,
          price: price
        }];
      }
    });

    // Reset temporary product state for the next item selection
    setQuantity(1);
  };

  // Modify cart item quantity directly inside the cart list
  const updateCartItemQty = (id: string, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  // Remove item from cart
  const handleRemoveFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  // Check out cart and submit to backend
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("請填寫訂購人姓名！");
      return;
    }
    if (!phone.trim()) {
      alert("請填寫訂購人手機號碼！");
      return;
    }
    if (!email.trim()) {
      alert("請填寫電子信箱帳號！");
      return;
    }
    if (shippingMethod === 'delivery' && !address.trim()) {
      alert("請填寫送貨地址！");
      return;
    }
    if (!deliveryDate.trim()) {
      alert("請選擇期望日期！");
      return;
    }

    if (shippingMethod === 'delivery') {
      if (deliveryDate < "2026-08-20" || deliveryDate > "2026-09-18") {
        alert("⚠️ 期望送貨日期僅可在民國 115 年的 08/20 至 09/18 (2026-08-20 至 2026-09-18) 區間內！");
        return;
      }
    } else {
      if (deliveryDate < "2026-08-20" || deliveryDate > "2026-09-22") {
        alert("⚠️ 期望自取日期僅可在民國 115 年的 08/20 至 09/22 (2026-08-20 至 2026-09-22) 區間內！");
        return;
      }
    }

    // A. DIRECT ORDER ROW UPDATE MODE OR BATCH CART CHECKOUT MODE
    if (editingOrder) {
      // 1. Direct row editing submission
      const payload: any = {
        orderId: editingOrder.orderId,
        name: name.trim(),
        mooncakes: selectedMooncakeName,
        quantity,
        totalPrice: itemTotalPrice,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        deliveryDate: deliveryDate
      };
      await onSubmit(payload);
    } else {
      // 2. Shopping Cart Checkout Submission
      if (cart.length === 0) {
        alert("您的購物車目前沒有商品，請先挑選月餅加入購物車！");
        return;
      }

      const finalCartItems = [...cart];
      const appliedShippingFee = shippingMethod === 'pickup'
        ? 0
        : (cartTotalAmount >= 3800 ? 0 : (shippingTemp === 'refrigerated' ? 450 : 200));
      
      if (appliedShippingFee > 0 && shippingMethod === 'delivery') {
        const shippingName = `運費 (${shippingTemp === 'refrigerated' ? '冷藏' : '常溫'})`;
        finalCartItems.push({
          id: `shipping-${Date.now()}`,
          mooncakeName: shippingName,
          quantity: 1,
          price: appliedShippingFee
        });
      }

      const payload: any = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: shippingMethod === 'pickup' ? (address.trim() || "門市自取") : address.trim(),
        deliveryDate: deliveryDate,
        cartItems: finalCartItems,
        isCartSubmit: true
      };

      await onSubmit(payload);
      
      // Clear cart on successful checkout
      setCart([]);
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setDeliveryDate("");
      setShippingMethod("delivery");
      setShippingTemp("room");
    }
  };

  return (
    <div id="order-form-container" className="bg-white rounded-2xl shadow-sm hover:shadow-md p-6 border border-natural-border transition-all duration-300">
      
      {/* Form header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-natural-border">
        <h2 className="serif text-xl font-bold text-[#3E3E3E] flex items-center gap-2.5">
          <span className={`w-1.5 h-6 rounded-full ${editingOrder ? 'bg-natural-terracotta animate-pulse' : 'bg-natural-accent'}`} />
          {editingOrder ? "修改我的月餅訂單" : "點選商品 ＞ 加入購物車 ＞ 填寫送貨資訊"}
        </h2>
        {editingOrder && (
          <button 
            type="button" 
            onClick={onCancelEdit}
            className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-all cursor-pointer flex items-center gap-1"
          >
            <X size={14} /> 取消修改
          </button>
        )}
      </div>

      {editingOrder ? (
        /* ==================== DIRECT ROW EDIT LAYOUT ==================== */
        <form onSubmit={handleCheckoutSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="sans text-xs font-bold text-[#5A5A40] flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                <User size={14} className="text-amber-800" /> 訂購人姓名 <span className="text-natural-terracotta">*</span>
              </label>
              <div className="relative group">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-800 transition-colors">
                  <User size={16} />
                </span>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：陳大文"
                  className="pl-10 pr-4 py-2.5 bg-[#FCFAF6] border border-[#E4DDD3] rounded-xl outline-none text-[#2C2C2C] placeholder-slate-400 focus:bg-white focus:border-amber-700/60 focus:ring-2 focus:ring-amber-100 transition-all text-sm font-medium hover:bg-white hover:border-slate-300 w-full"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <label className="sans text-xs font-bold text-[#5A5A40] flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                <Phone size={14} className="text-amber-800" /> 手機號碼 <span className="text-natural-terracotta">*</span>
              </label>
              <div className="relative group">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-800 transition-colors">
                  <Phone size={16} />
                </span>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="例如：0912-345678"
                  className="pl-10 pr-4 py-2.5 bg-[#FCFAF6] border border-[#E4DDD3] rounded-xl outline-none text-[#2C2C2C] placeholder-slate-400 focus:bg-white focus:border-amber-700/60 focus:ring-2 focus:ring-amber-100 transition-all text-sm font-medium hover:bg-white hover:border-slate-300 w-full"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="sans text-xs font-bold text-[#5A5A40] flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                <Mail size={14} className="text-amber-800" /> 電子信箱 <span className="text-natural-terracotta">*</span>
              </label>
              <div className="relative group">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-800 transition-colors">
                  <Mail size={16} />
                </span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="例如：angela@example.com"
                  className="pl-10 pr-4 py-2.5 bg-[#FCFAF6] border border-[#E4DDD3] rounded-xl outline-none text-[#2C2C2C] placeholder-slate-400 focus:bg-white focus:border-amber-700/60 focus:ring-2 focus:ring-amber-100 transition-all text-sm font-medium hover:bg-white hover:border-slate-300 w-full"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <label className="sans text-xs font-bold text-[#5A5A40] flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                <Calendar size={14} className="text-amber-800" /> 預期送貨日期 <span className="text-natural-terracotta">*</span>
              </label>
              <div className="relative group">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-800 transition-colors">
                  <Calendar size={16} />
                </span>
                <input 
                  type="date" 
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-[#FCFAF6] border border-[#E4DDD3] rounded-xl outline-none text-[#2C2C2C] placeholder-slate-400 focus:bg-white focus:border-amber-700/60 focus:ring-2 focus:ring-amber-100 transition-all text-sm font-medium hover:bg-white hover:border-slate-300 w-full font-mono"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="sans text-xs font-bold text-[#5A5A40] flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
              <MapPin size={14} className="text-amber-800" /> 送貨地址 <span className="text-natural-terracotta">*</span>
            </label>
            <div className="relative group">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-800 transition-colors">
                <MapPin size={16} />
              </span>
              <input 
                type="text" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="例如：台北市信義區信義路五段7號"
                className="pl-10 pr-4 py-2.5 bg-[#FCFAF6] border border-[#E4DDD3] rounded-xl outline-none text-[#2C2C2C] placeholder-slate-400 focus:bg-white focus:border-amber-700/60 focus:ring-2 focus:ring-amber-100 transition-all text-sm font-medium hover:bg-white hover:border-slate-300 w-full"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="border-t border-dashed border-natural-border pt-4">
            <span className="sans text-[11px] font-bold text-[#5A5A40] block mb-2 uppercase tracking-wider">月餅款式與數量</span>
            <div className="bg-natural-header rounded-xl p-4 border border-natural-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-natural-border bg-slate-100">
                  <img src={getMooncakeImage(currentMooncake || { name: selectedMooncakeName })} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-[#2C2C2C] text-sm">{selectedMooncakeName}</h4>
                  <span className="text-xs text-natural-terracotta font-mono font-bold">${currentMooncake?.price || 0} / 盒</span>
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center gap-3 bg-white border border-natural-border rounded-full px-3.5 py-1">
                <button
                  type="button"
                  disabled={quantity <= 1 || isSubmitting}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-base font-bold text-slate-500 hover:scale-110 active:scale-95 disabled:opacity-30 cursor-pointer w-5 h-5 flex items-center justify-center"
                >
                  −
                </button>
                <span className="font-bold text-[#2C2C2C] text-sm w-6 text-center select-none font-mono">{quantity}</span>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-base font-bold text-slate-500 hover:scale-110 active:scale-95 cursor-pointer w-5 h-5 flex items-center justify-center"
                >
                  +
                </button>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">小計</span>
                <span className="serif text-xl font-bold text-natural-terracotta font-mono">${itemTotalPrice}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-natural-terracotta hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl shadow-md cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : <Check size={16} />}
            儲存修改並同步到雲端
          </button>
        </form>
      ) : (
        /* ==================== INTUITIVE CART + CHECKOUT GRID ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUMN 1: SELECT PRODUCT GRID - (7 cols space) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="serif text-sm font-bold text-[#2C2C2C] flex items-center gap-1.5 border-b border-dotted border-natural-border pb-2">
              <span className="text-lime-700">🥮</span> 步驟一：挑選中秋月餅與數量
            </h3>

            {/* Mooncake products selection list */}
            {menu.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-natural-border rounded-xl text-slate-400 text-xs">
                🥮 正在下載最新月餅口味與圖片...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
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
                          ? 'border-natural-accent bg-natural-header/50 ring-1 ring-natural-accent shadow-sm scale-[0.99]' 
                          : 'border-natural-border bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Image block */}
                      <div className="h-28 w-full bg-slate-50 relative overflow-hidden border-b border-natural-border flex items-center justify-center shrink-0">
                        <img 
                          src={imgSrc} 
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=400';
                          }}
                        />
                        <span className="absolute top-2 left-2 bg-[#2C2C2C]/70 text-white text-[9px] px-2 py-0.5 rounded-full font-serif font-medium backdrop-blur-xs">
                          {item.category || "中秋禮盒"}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-natural-accent text-white rounded-full p-1 shadow-md">
                            <Check size={11} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      
                      {/* Description / details */}
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-serif font-bold text-[12.5px] text-[#2C2C2C] leading-snug group-hover:text-natural-accent transition-colors">
                            {item.name}
                          </h4>
                          {(() => {
                            const displayDesc = cleanDescription(item.description);
                            return displayDesc ? (
                              <p className="text-[10.5px] text-slate-500 leading-normal mt-1 line-clamp-2">
                                {displayDesc}
                              </p>
                            ) : null;
                          })()}
                        </div>
                        
                        <div className="mt-2.5 pt-2 border-t border-natural-border flex justify-between items-baseline shrink-0">
                          <span className="text-[10px] text-slate-400 font-medium">單價</span>
                          <span className="text-xs font-bold text-natural-terracotta font-mono">
                            ${item.price} / 盒
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selection bar count + Add to cart trigger */}
            <div className="bg-[#F9F6F0]/60 rounded-xl p-4 border border-natural-border mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 uppercase select-none font-bold block">選中口味</span>
                  <span className="font-serif text-xs font-bold text-[#2c2c2c] truncate max-w-[150px] block">
                    {selectedMooncakeName || "尚未選點"}
                  </span>
                </div>
                
                {/* Quantity */}
                <div className="flex items-center gap-2.5 bg-white border border-natural-border rounded-full px-3.5 py-1">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-base font-bold text-slate-500 hover:scale-110 active:scale-95 disabled:opacity-30 cursor-pointer w-4 h-4 flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="font-semibold text-slate-800 text-xs w-5 text-center select-none font-mono">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="text-base font-bold text-slate-500 hover:scale-110 active:scale-95 cursor-pointer w-4 h-4 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedMooncakeName}
                className="bg-natural-accent hover:opacity-95 disabled:opacity-40 text-white font-bold text-xs py-2.5 px-4.5 rounded-lg shadow-sm active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 font-serif"
              >
                <ShoppingCart size={14} />
                加入購物車
              </button>
            </div>
          </div>

          {/* COLUMN 2: SHOPPING CART LIST & CHECKOUT FORM - (5 cols space) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Shopping Cart box */}
            <div className="bg-slate-50/50 rounded-xl p-4.5 border border-natural-border space-y-3.5">
              <div className="flex items-center justify-between border-b border-dashed border-natural-border pb-2.5">
                <h3 className="serif text-xs font-bold text-[#2C2C2C] flex items-center gap-1">
                  <span>🛒</span> 步驟二：我的購物車 ({cart.length} 項品項)
                </h3>
                {cart.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setCart([])} 
                    className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Trash2 size={11} /> 清空
                  </button>
                )}
              </div>

              {/* Cart contents listing */}
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs space-y-2 flex flex-col items-center">
                  <ShoppingBag className="text-slate-300" size={32} />
                  <p className="font-semibold">購物車目前空空的</p>
                  <p className="text-[10px] text-slate-400">請從左側挑選月餅與數量，並點擊「加入購物車」</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-0.5">
                  {cart.map((item) => {
                    const matchedMenu = menu.find(m => m.name === item.mooncakeName);
                    const itemImg = getMooncakeImage(matchedMenu || { name: item.mooncakeName });
                    
                    return (
                      <div 
                        key={item.id} 
                        className="bg-white border border-natural-border rounded-lg p-2 flex items-center justify-between gap-3 text-xs shadow-xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <img src={itemImg} alt="" className="w-8 h-8 object-cover rounded-md border border-natural-border shrink-0" />
                          <div className="truncate">
                            <h5 className="font-bold text-[#2C2C2C] text-[11px] font-serif truncate max-w-[120px]" title={item.mooncakeName}>
                              {item.mooncakeName}
                            </h5>
                            <span className="text-[10px] text-slate-400 font-mono">${item.price} / 盒</span>
                          </div>
                        </div>

                        {/* Adjust qty & Delete */}
                        <div className="flex items-center gap-2 bg-slate-50 border border-natural-border rounded-full px-2 py-0.5">
                          <button
                            type="button"
                            onClick={() => updateCartItemQty(item.id, -1)}
                            className="w-3.5 h-3.5 flex items-center justify-center font-bold text-slate-500 hover:text-[#5A5A40] text-[11px] cursor-pointer"
                          >
                            −
                          </button>
                          <span className="font-semibold text-slate-800 text-[11px] w-4 text-center font-mono select-none">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateCartItemQty(item.id, 1)}
                            className="w-3.5 h-3.5 flex items-center justify-center font-bold text-slate-500 hover:text-[#5A5A40] text-[11px] cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-natural-terracotta text-[11px] font-mono">${item.quantity * item.price}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total Row */}
              {cart.length > 0 && (
                <div className="border-t border-dashed border-natural-border pt-2.5 space-y-2.5">
                  
                  {/* Interactive Selector inside the Shopping Cart */}
                  <div className="bg-amber-55/20 border border-amber-100 rounded-xl p-2.5 space-y-2">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-[#5A5A40] flex items-center gap-1.5 select-none">
                        <span>📦</span> 選擇取貨或運送方式：
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => setShippingMethod('delivery')}
                          className={`py-1 px-1.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                            shippingMethod === 'delivery'
                              ? 'border-amber-700/60 bg-amber-100/75 text-amber-950 ring-1 ring-amber-700/30'
                              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <span>🚚 宅配到府</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShippingMethod('pickup')}
                          className={`py-1 px-1.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                            shippingMethod === 'pickup'
                              ? 'border-amber-700/60 bg-amber-100/75 text-amber-950 ring-1 ring-amber-700/30'
                              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <span>🏬 現場自取</span>
                        </button>
                      </div>
                    </div>

                    {shippingMethod === 'delivery' && (
                      <div className="space-y-1 pt-1.5 border-t border-dashed border-amber-200/50">
                        <span className="text-[10px] font-bold text-[#5A5A40] flex items-center gap-1 select-none">
                          <span>🌡️</span> 選擇宅配溫層：
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => setShippingTemp('room')}
                            className={`py-1 px-1.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-0.5 shrink-0 ${
                              shippingTemp === 'room'
                                ? 'border-amber-700/50 bg-amber-50/60 text-amber-900 ring-1 ring-amber-700/20'
                                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            <span>🍞 常溫 ($200)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShippingTemp('refrigerated')}
                            className={`py-1 px-1.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-0.5 shrink-0 ${
                              shippingTemp === 'refrigerated'
                                ? 'border-sky-600/50 bg-sky-50/60 text-sky-900 ring-1 ring-sky-600/20'
                                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            <span>❄️ 冷藏 ($450)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span>商品盒數 / 小計:</span>
                    <span>{cartTotalItems} 盒 · ${cartTotalAmount} 元</span>
                  </div>
                  
                  <div className="flex justify-between text-xs font-semibold items-center">
                    <span className="text-slate-500">
                      {shippingMethod === 'pickup' ? (
                        <span>🏬 現場自取費:</span>
                      ) : (
                        <span>🚚 運費 ({shippingTemp === 'refrigerated' ? '冷藏' : '常溫'}):</span>
                      )}
                    </span>
                    {shippingMethod === 'pickup' ? (
                      <span className="text-amber-700 font-bold bg-amber-50 border border-amber-100 rounded-md px-1.5 py-0.5 text-[10.5px] select-none">
                        免運費 ($0) 🛍️
                      </span>
                    ) : cartTotalAmount >= 3800 ? (
                      <span className="text-green-700 font-bold bg-green-50 border border-green-100 rounded-md px-1.5 py-0.5 text-[10.5px] select-none">
                        免運費 (已滿 $3,800) 🎉
                      </span>
                    ) : (
                      <span className="text-natural-terracotta font-bold font-mono">
                        ${shippingFee} 元
                      </span>
                    )}
                  </div>
                  
                  {shippingMethod === 'delivery' && cartTotalAmount < 3800 && (
                    <div className="text-[10px] text-amber-700/80 text-right bg-amber-50/50 rounded-md p-1.5 border border-amber-100/50">
                      💡 買滿 <span className="font-bold">$3,800</span> 免運費，還差 <span className="font-bold font-mono text-[#D97706] text-xs">${3800 - cartTotalAmount}</span> 元！
                    </div>
                  )}

                  <div className="border-t border-slate-200/60 pt-2 flex justify-between items-baseline">
                    <span className="text-[11px] font-bold text-[#2C2C2C]">
                      {shippingMethod === 'pickup' ? '應付總金額 (自取):' : '應付總金額 (含運費):'}
                    </span>
                    <span className="serif text-xl font-bold text-natural-terracotta font-mono">${totalAmountWithShipping} 元</span>
                  </div>
                </div>
              )}
            </div>

            {/* Check out Form Information */}
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <h3 className="serif text-sm font-bold text-[#2C2C2C] flex items-center gap-1.5 border-b border-dotted border-natural-border pb-2.5">
                <span className="text-[#bf8f30]">📍</span> 步驟三：填寫送貨與聯絡資訊
              </h3>

              <div className="space-y-3.5">
                {/* Name */}
                <div>
                  <label className="sans text-xs font-bold text-[#5A5A40] flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                    <User size={14} className="text-amber-800" /> 訂購人姓名 <span className="text-natural-terracotta">*</span>
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-800 transition-colors">
                      <User size={16} />
                    </span>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="例如：陳大文"
                      className="pl-10 pr-4 py-2.5 bg-[#FCFAF6] border border-[#E4DDD3] rounded-xl outline-none text-[#2C2C2C] placeholder-slate-400 focus:bg-white focus:border-amber-700/60 focus:ring-2 focus:ring-amber-100 transition-all text-sm font-medium hover:bg-white hover:border-slate-300 w-full"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="sans text-xs font-bold text-[#5A5A40] flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                    <Phone size={14} className="text-amber-800" /> 訂購人手機號碼 <span className="text-natural-terracotta">*</span>
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-800 transition-colors">
                      <Phone size={16} />
                    </span>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="例如：0912-345678"
                      className="pl-10 pr-4 py-2.5 bg-[#FCFAF6] border border-[#E4DDD3] rounded-xl outline-none text-[#2C2C2C] placeholder-slate-400 focus:bg-white focus:border-amber-700/60 focus:ring-2 focus:ring-amber-100 transition-all text-sm font-medium hover:bg-white hover:border-slate-300 w-full"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="sans text-xs font-bold text-[#5A5A40] flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                    <Mail size={14} className="text-amber-800" /> 電子信箱帳號 <span className="text-natural-terracotta">*</span>
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-800 transition-colors">
                      <Mail size={16} />
                    </span>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="例如：angela@example.com"
                      className="pl-10 pr-4 py-2.5 bg-[#FCFAF6] border border-[#E4DDD3] rounded-xl outline-none text-[#2C2C2C] placeholder-slate-400 focus:bg-white focus:border-amber-700/60 focus:ring-2 focus:ring-amber-100 transition-all text-sm font-medium hover:bg-white hover:border-slate-300 w-full"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="sans text-xs font-bold text-[#5A5A40] flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                    <MapPin size={14} className="text-amber-800" /> {shippingMethod === 'pickup' ? "自取備註 / 聯絡資訊" : "送貨地址"} {shippingMethod === 'delivery' && <span className="text-natural-terracotta">*</span>}
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-800 transition-colors">
                      <MapPin size={16} />
                    </span>
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={shippingMethod === 'pickup' ? "例如：自取（板橋總店），或留空則預設「門市自取」" : "例如：台北市信義區信義路五段7號"}
                      className="pl-10 pr-4 py-2.5 bg-[#FCFAF6] border border-[#E4DDD3] rounded-xl outline-none text-[#2C2C2C] placeholder-slate-400 focus:bg-white focus:border-amber-700/60 focus:ring-2 focus:ring-amber-100 transition-all text-sm font-medium hover:bg-white hover:border-slate-300 w-full"
                      required={shippingMethod === 'delivery'}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Delivery Date */}
                <div>
                  <label className="sans text-xs font-bold text-[#5A5A40] flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                    <Calendar size={14} className="text-amber-800" /> {shippingMethod === 'pickup' ? "期望自取日期" : "期望送貨日期"} <span className="text-natural-terracotta">*</span>
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-800 transition-colors">
                      <Calendar size={16} />
                    </span>
                    <input 
                      type="date" 
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      min="2026-08-20"
                      max={shippingMethod === 'pickup' ? "2026-09-22" : "2026-09-18"}
                      className="pl-10 pr-4 py-2.5 bg-[#FCFAF6] border border-[#E4DDD3] rounded-xl outline-none text-[#2C2C2C] placeholder-slate-400 focus:bg-white focus:border-amber-700/60 focus:ring-2 focus:ring-amber-100 transition-all text-sm font-medium hover:bg-white hover:border-slate-300 w-full font-mono font-bold"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <p className="text-[10.5px] text-amber-800 mt-1.5 font-medium bg-amber-50/75 rounded-lg border border-amber-200/50 px-2.5 py-1.5 leading-relaxed select-none">
                    📅 <strong>日期區間限制：</strong>民國 115 年 08/20 至 {shippingMethod === 'pickup' ? '09/22' : '09/18'} 止 (2026-08-20 ~ {shippingMethod === 'pickup' ? '2026-09-22' : '2026-09-18'})。
                  </p>
                </div>

                {/* Shipping Selection Block */}
                <div className="bg-[#FAF8F5] border border-slate-200/60 rounded-xl p-3.5 space-y-3">
                  <div>
                    <label className="sans text-xs font-bold text-[#5A5A40] flex items-center gap-1.5 uppercase tracking-wider mb-1">
                      <span>📦</span> 選擇取貨/送貨方式 <span className="text-natural-terracotta">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 mt-1.5 font-sans">
                      <button
                        type="button"
                        onClick={() => setShippingMethod('delivery')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          shippingMethod === 'delivery'
                            ? 'border-amber-700/60 bg-amber-50 ring-1 ring-amber-700/50 font-extrabold text-amber-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm">🚚</span>
                        <span>宅配到府</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShippingMethod('pickup')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          shippingMethod === 'pickup'
                            ? 'border-amber-700/60 bg-amber-50 ring-1 ring-amber-700/50 font-extrabold text-amber-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm">🏬</span>
                        <span>現場自取</span>
                      </button>
                    </div>
                  </div>

                  {shippingMethod === 'delivery' ? (
                    <div className="pt-2.5 border-t border-dashed border-slate-200/80 space-y-2">
                      <label className="sans text-xs font-bold text-[#5A5A40] flex items-center gap-1.5 uppercase tracking-wider">
                        <span>🌡️</span> 選擇宅配溫層 <span className="text-natural-terracotta">*</span>
                      </label>
                      <p className="text-[10px] text-slate-400 font-sans">
                        免運門檻：滿 $3,800 免運費；未滿常溫 $200 元、冷藏 $450 元
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setShippingTemp('room')}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            shippingTemp === 'room'
                              ? 'border-amber-700/60 bg-amber-50/40 ring-1 ring-amber-700/50 font-extrabold text-amber-900'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-sm">🍞</span>
                          <span>常溫配送 ($200)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShippingTemp('refrigerated')}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            shippingTemp === 'refrigerated'
                              ? 'border-sky-600/60 bg-sky-50/45 ring-1 ring-sky-600/50 font-extrabold text-sky-900'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-sm">❄️</span>
                          <span>冷藏配送 ($450)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2.5 border-t border-dashed border-slate-200/80">
                      <p className="text-[11px] text-amber-700 bg-amber-50/60 border border-amber-100 rounded-lg p-2.5 flex items-start gap-1.5 leading-relaxed">
                        <span>💡</span>
                        <span>自取無需支付任何宅配運費！送貨地址欄位預設為「門市自取」，若有特別自取備註（如指定門市或保留時間），您仍可在上方文字欄位中填寫。</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Checkout submit button */}
              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full bg-natural-terracotta hover:opacity-90 disabled:opacity-40 text-white py-3 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    正在傳送至 Google 試算表...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    確認結帳送出 (共 {cartTotalItems} 盒 / {totalAmountWithShipping} 元)
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
