/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Moon, Sparkles, ShoppingCart, RefreshCw, Layers, Calendar, 
  Smile, ShoppingBag, Heart, Coffee, FileSpreadsheet, PlusCircle, CheckCircle, AlertCircle, X 
} from 'lucide-react';
import { Mooncake, Order, ActionType } from './types';
import { DEFAULT_MENU, INITIAL_MOCK_ORDERS } from './data/mockData';
import OrderForm from './components/OrderForm';
import OrderList from './components/OrderList';
import Statistics from './components/Statistics';

interface BannerAlert {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

// Helper to safely normalize orders to support mooncakes & legacy beverage fields
const normalizeOrders = (ordersList: any[]): Order[] => {
  if (!ordersList || !Array.isArray(ordersList)) return [];
  return ordersList.map((order: any) => ({
    ...order,
    mooncakes: order.mooncakes || order.drink || "廣式蓮蓉月餅",
    quantity: typeof order.quantity === 'number' ? order.quantity : parseInt(order.quantity) || 1,
    totalPrice: typeof order.totalPrice === 'number' ? order.totalPrice : parseFloat(order.totalPrice) || 0
  }));
};

export default function App() {
  // 1. Core state
  const [gasUrl, setGasUrl] = useState<string>(() => {
    return localStorage.getItem('gas_api_url') || 'https://script.google.com/macros/s/AKfycbzKRS1L-uvdn7ZzdyK8ZLet8cOGCkkhXzGx2bZIXx7GAMd9F7g2PN6RFSEZJpjCu-5O/exec';
  });
  const [menu, setMenu] = useState<Mooncake[]>(DEFAULT_MENU);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  // 2. Status flags
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTestingUrl, setIsTestingUrl] = useState<boolean>(false);
  const [testSuccess, setTestSuccess] = useState<boolean>(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 3. User alerts state
  const [alerts, setAlerts] = useState<BannerAlert[]>([]);

  const addAlert = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    const id = Date.now().toString();
    setAlerts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 4500);
  }, []);

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  // 4. Data Sync Function (GET)
  const syncWithCloud = useCallback(async (targetUrl: string) => {
    if (!targetUrl) return;
    setIsLoading(true);
    try {
      // Fetch current orders & premium menu options
      const response = await fetch(targetUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.menu && data.menu.length > 0) {
        setMenu(data.menu);
      } else {
        setMenu(DEFAULT_MENU);
      }

      if (data.orders) {
        setOrders(normalizeOrders(data.orders));
      } else {
        setOrders([]);
      }
      
      addAlert('success', `☁️ 同步雲端成功！已與 Google Apps Script 最新數據對齊。`);
    } catch (err: any) {
      console.error("Cloud GET error:", err);
      addAlert('error', `🚫 連線至 Google 試算表失敗：${err.message || err}。已還原至本地沙盒快取。`);
      // Restore from local cache on failure
      const cached = localStorage.getItem('local_orders');
      if (cached) {
        setOrders(normalizeOrders(JSON.parse(cached)));
      }
    } finally {
      setIsLoading(false);
    }
  }, [addAlert]);

  // Load initial dataset (local or cloud) on startup
  useEffect(() => {
    if (gasUrl) {
      syncWithCloud(gasUrl);
    } else {
      // Local Database initialization
      const local = localStorage.getItem('local_orders');
      if (local) {
        setOrders(normalizeOrders(JSON.parse(local)));
      } else {
        // Hydrate with premium initial demo data
        localStorage.setItem('local_orders', JSON.stringify(INITIAL_MOCK_ORDERS));
        setOrders(normalizeOrders(INITIAL_MOCK_ORDERS));
        addAlert('info', `🥮 已預先載入 5 筆精美的中秋月餅模擬點單資料供試玩！`);
      }
      setMenu(DEFAULT_MENU);
    }
  }, [gasUrl, syncWithCloud, addAlert]);

  // 5. Test connection handle
  const handleTestConnection = async () => {
    if (!gasUrl) return;
    setIsTestingUrl(true);
    setTestSuccess(false);
    setTestError(null);
    try {
      const response = await fetch(gasUrl, {
        method: 'GET',
        mode: 'cors'
      });
      if (!response.ok) {
        throw new Error(`回傳 HTTP 狀態碼：${response.status}`);
      }
      const data = await response.json();
      if (data && ('menu' in data || 'orders' in data)) {
        setTestSuccess(true);
        addAlert('success', '✅ 連線成功！工作表格式相容且握手完畢。');
      } else {
        throw new Error('回傳 JSON 格式並非合法的月餅訂購 API 模型');
      }
    } catch (err: any) {
      setTestError(err.message || '無法連線：請確認 GAS 連線網址是否正確並已公開。');
      addAlert('error', '⚠️ GAS 連線測試失敗，請檢查權限及 URL 結構。');
    } finally {
      setIsTestingUrl(false);
    }
  };

  // 6. Save new/clear GAS Web App URL
  const handleSaveGasUrl = (newUrl: string) => {
    if (newUrl) {
      localStorage.setItem('gas_api_url', newUrl);
      setGasUrl(newUrl);
      addAlert('success', '💾 已儲存 Google Apps Script 雲端連線網址！正在撈取遠端試算表數據...');
    } else {
      localStorage.removeItem('gas_api_url');
      setGasUrl('');
      // Reset database cache to preloaded mock orders
      const local = localStorage.getItem('local_orders') || JSON.stringify(INITIAL_MOCK_ORDERS);
      setOrders(normalizeOrders(JSON.parse(local)));
      setMenu(DEFAULT_MENU);
      addAlert('info', '💡 已切換回「本地模擬器模式」，點單皆暫存在本地瀏覽器快取中。');
    }
  };

  // 7. Order Action Handle (Create & Update)
  const handleOrderSubmit = async (formData: any) => {
    setIsSubmitting(true);
    const currentDateStr = new Date().toISOString();

    if (gasUrl) {
      // ☁️ CLOUD GOOGLE SHEETS SYNC MODE
      const action: ActionType = formData.orderId ? 'update' : 'create';
      try {
        if (formData.isCartSubmit) {
          // Flatten cart items and submit them sequentially to maintain 100% backward compatibility
          // with older Google Apps Script deployments that do not handle arrays of rows.
          for (const item of formData.cartItems) {
            const currentItemPayload = {
              action,
              data: {
                name: formData.name,
                mooncakes: item.mooncakeName,
                drink: item.mooncakeName, // beverage legacy field fallback
                quantity: item.quantity,
                totalPrice: item.quantity * item.price,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                deliveryDate: formData.deliveryDate
              }
            };

            const response = await fetch(gasUrl, {
              method: 'POST',
              mode: 'cors',
              headers: {
                'Content-Type': 'text/plain;charset=utf-8', // GAS can throw preflight blockers sometimes if application/json
              },
              body: JSON.stringify(currentItemPayload)
            });

            if (!response.ok) {
              throw new Error(`HTTP 伺服器錯誤！代碼：${response.status}`);
            }

            const resData = await response.json();
            if (resData.status !== 'success') {
              throw new Error(resData.message || '試算表寫入失敗');
            }
          }

          addAlert('success', '🎉 購物車全部商品已成功寫入今日試算表！中秋快樂！');
          setEditingOrder(null);
          await syncWithCloud(gasUrl);
        } else {
          const postData = {
            orderId: formData.orderId,
            name: formData.name,
            mooncakes: formData.mooncakes,
            drink: formData.mooncakes, // beverage legacy field fallback
            quantity: formData.quantity,
            totalPrice: formData.totalPrice,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            deliveryDate: formData.deliveryDate
          };

          const postBody = {
            action,
            data: postData
          };

          const response = await fetch(gasUrl, {
            method: 'POST',
            mode: 'cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(postBody)
          });

          if (!response.ok) {
            throw new Error(`HTTP 伺服器錯誤！代碼：${response.status}`);
          }

          const resData = await response.json();
          if (resData.status === 'success') {
            addAlert('success', '✍️ 試算表訂單修改成功！');
            setEditingOrder(null);
            await syncWithCloud(gasUrl);
          } else {
            throw new Error(resData.message || '試算表寫入失敗');
          }
        }
      } catch (err: any) {
        console.error("Cloud POST error:", err);
        addAlert('error', `🚫 寫入雲端失敗：${err.message || err}`);
      } finally {
        setIsSubmitting(false);
      }

    } else {
      // 💻 LOCAL OFFLINE SIMULATION MODE
      // Mimic backend operations in local databases
      setTimeout(() => {
        let updatedOrders: Order[] = [...orders];
        if (formData.orderId) {
          // Update action
          updatedOrders = updatedOrders.map(o => {
            if (o.orderId === formData.orderId) {
              return {
                ...o,
                name: formData.name,
                mooncakes: formData.mooncakes,
                quantity: formData.quantity,
                totalPrice: formData.totalPrice,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                deliveryDate: formData.deliveryDate
              };
            }
            return o;
          });
          addAlert('success', '✍️ 已修改訂單資訊（本地模擬器模式）');
          setEditingOrder(null);
        } else if (formData.isCartSubmit) {
          // Create batch items
          const newOrders: Order[] = formData.cartItems.map((item: any, idx: number) => ({
            orderId: `local-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
            timestamp: currentDateStr,
            name: formData.name,
            mooncakes: item.mooncakeName,
            quantity: item.quantity,
            totalPrice: item.quantity * item.price,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            deliveryDate: formData.deliveryDate
          }));
          updatedOrders = [...newOrders, ...updatedOrders];
          addAlert('success', `🎉 購物車內 ${formData.cartItems.length} 項品項成功結帳送出！（本地模擬器模式）`);
        } else {
          // Create fallback single action
          const newOrder: Order = {
            orderId: `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: currentDateStr,
            name: formData.name,
            mooncakes: formData.mooncakes,
            quantity: formData.quantity,
            totalPrice: formData.totalPrice,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            deliveryDate: formData.deliveryDate
          };
          updatedOrders.unshift(newOrder);
          addAlert('success', '🎉 點單成功遞交！已收錄至統計中（本地模擬器模式）');
        }
        
        // Save to cache
        localStorage.setItem('local_orders', JSON.stringify(updatedOrders));
        setOrders(normalizeOrders(updatedOrders));
        setIsSubmitting(false);
      }, 600); // Add simulated net lag
    }
  };

  // 8. Delete Order Handle (POST/delete for cloud, filter for local)
  const handleOrderDelete = async (orderId: string) => {
    setIsLoading(true);

    if (gasUrl) {
      // ☁️ CLOUD GOOGLE SHEETS SYNC MODE
      try {
        const postBody = {
          action: 'delete',
          data: { orderId }
        };

        const response = await fetch(gasUrl, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(postBody)
        });

        if (!response.ok) {
          throw new Error(`HTTP 伺服器錯誤！代碼：${response.status}`);
        }

        const resData = await response.json();
        if (resData.status === 'success') {
          addAlert('success', '🗑️ 雲端試算表訂單刪除成功！已為您扣減對應採購量。');
          await syncWithCloud(gasUrl);
        } else {
          throw new Error(resData.message || '刪除失敗');
        }
      } catch (err: any) {
        console.error("Cloud Delete error:", err);
        addAlert('error', `🚫 寫入雲端失敗：${err.message || err}`);
      } finally {
        setIsLoading(false);
      }

    } else {
      // 💻 LOCAL OFFLINE SIMULATION MODE
      setTimeout(() => {
        const updatedOrders = orders.filter(o => o.orderId !== orderId);
        localStorage.setItem('local_orders', JSON.stringify(updatedOrders));
        setOrders(normalizeOrders(updatedOrders));
        setIsLoading(false);
        addAlert('success', '🗑️ 訂單已刪除（本地模擬器模式）');
      }, 300);
    }
  };

  // Trigger form scrolling when editing
  const handleEditClick = (order: Order) => {
    setEditingOrder(order);
    const formElement = document.getElementById('order-form-container');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRefresh = async () => {
    if (gasUrl) {
      await syncWithCloud(gasUrl);
    }
  };

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans antialiased pb-20">
      
      {/* Pristine Warm-White Decorative Header Bar */}
      <header className="relative bg-[#FDFBF7] overflow-hidden py-10 px-4 border-b border-natural-border">
        {/* Absolute Background Accents for "Mid-Autumn Lunar/Full Moon" feeling */}
        <div className="absolute right-12 top-6 w-32 h-32 rounded-full bg-[#5A5A40]/5 blur-xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-[#A64B2A]/5 blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 transform -translate-y-1/2 w-2 h-2 rounded-full bg-natural-terracotta opacity-20 animate-pulse pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Brand/Festival Title */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-natural-accent/10 text-natural-accent rounded-full text-xs font-semibold uppercase tracking-wider border border-natural-border backdrop-blur-xs">
              <Sparkles size={12} className="text-natural-terracotta animate-pulse" />
              中秋佳節月餅 🥮
            </div>
            
            <div className="flex items-center gap-3">
              <Moon className="text-natural-terracotta fill-natural-terracotta animate-pulse" size={32} />
              <h1 className="serif text-3xl font-black tracking-tight text-[#2C2C2C]">
                安琪拉烘焙工作室月餅訂購系統
              </h1>
            </div>

            <p className="text-slate-500 text-xs sm:text-sm max-w-lg leading-relaxed font-medium">
              花好月圓，同心同甜！支援<b>每日自動分頁</b>數據結構，將點單即時彙整至雲端 Google 客製 Sheets，輕鬆搞定中秋禮盒。
            </p>
          </div>

          {/* Sync status widget in header */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3">
            <div className={`p-3.5 rounded-2xl flex items-center gap-3 border ${
              gasUrl 
                ? 'bg-emerald-50/50 border-emerald-250 text-emerald-800' 
                : 'bg-natural-header border-natural-border text-[#5A5A40]'
            }`}>
              <div className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  gasUrl ? 'bg-emerald-400' : 'bg-natural-terracotta'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  gasUrl ? 'bg-emerald-500' : 'bg-natural-terracotta'
                }`}></span>
              </div>
              <div className="text-left text-xs">
                <p className="font-bold">連線狀態</p>
                <p className="opacity-80 font-mono text-[10px] sm:text-xs">
                  {gasUrl ? '☁️ 已連接雲端 Google Sheets' : '💻 本地模擬器中 (離線)'}
                </p>
              </div>
            </div>

            {gasUrl && (
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-3 bg-white hover:bg-natural-bg font-bold text-xs rounded-xl border border-natural-border text-natural-accent shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                立即重整
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Dynamic Statistical Metrics Section */}
        <Statistics orders={orders} />

        {/* Spacious layout stack dividing OrderForm and OrderList */}
        <div className="space-y-10">
          
          {/* Interactive Ordering Form / Shopping Cart */}
          <OrderForm 
            menu={menu}
            onSubmit={handleOrderSubmit}
            editingOrder={editingOrder}
            onCancelEdit={() => setEditingOrder(null)}
            isSubmitting={isSubmitting}
          />

          {/* Detailed Order Registries */}
          <OrderList 
            orders={orders}
            menu={menu}
            onEdit={handleEditClick}
            onDelete={handleOrderDelete}
            isLoading={isLoading}
            gasUrl={gasUrl}
            onRefresh={handleRefresh}
          />

        </div>
      </main>

      {/* Soft footer */}
      <footer className="mt-20 pt-8 border-t border-natural-border text-center text-xs text-slate-400 space-y-2">
        <p className="flex items-center justify-center gap-1 font-serif text-[13px] font-bold text-[#5A5A40]">
          <span>🥮 安琪拉烘焙工作室月餅訂購系統</span> ·
          <span>精心烘焙 · 傳遞溫馨中秋</span>
        </p>
        <p className="opacity-80 font-semibold font-serif text-[10px] tracking-wide">
          Made with 💛 for delicious mooncakes · © 2026 安琪拉烘焙工作室
        </p>
      </footer>

      {/* Floating sliding alerts container */}
      <div id="alerts" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`flex items-start gap-2.5 p-4 rounded-xl shadow-lg border text-xs font-semibold animate-slide-in leading-relaxed ${
              alert.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800 shadow-emerald-100/10' 
                : alert.type === 'error'
                  ? 'bg-rose-50 border-rose-100 text-rose-800 shadow-rose-100/10'
                  : 'bg-blue-50 border-blue-100 text-blue-800 shadow-blue-100/10'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {alert.type === 'success' && <CheckCircle size={15} className="text-emerald-600" />}
              {alert.type === 'error' && <AlertCircle size={15} className="text-rose-600" />}
              {alert.type === 'info' && <Sparkles size={15} className="text-blue-600 animate-pulse" />}
            </div>
            
            <div className="flex-1 text-left">{alert.text}</div>

            <button
              onClick={() => removeAlert(alert.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 cursor-pointer p-0.5 hover:bg-slate-100 rounded-md"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
