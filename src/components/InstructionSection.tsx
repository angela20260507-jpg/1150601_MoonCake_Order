/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, HelpCircle, ChevronDown, ChevronUp, Copy, Check, 
  Settings, CheckCircle, RefreshCw, AlertCircle, Info, ExternalLink 
} from 'lucide-react';

interface InstructionSectionProps {
  gasUrl: string;
  onSaveUrl: (url: string) => void;
  isTestingUrl: boolean;
  testError: string | null;
  testSuccess: boolean;
  onTestConnection: () => void;
}

export default function InstructionSection({
  gasUrl,
  onSaveUrl,
  isTestingUrl,
  testError,
  testSuccess,
  onTestConnection
}: InstructionSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inputUrl, setInputUrl] = useState(gasUrl);

  React.useEffect(() => {
    setInputUrl(gasUrl);
  }, [gasUrl]);

  const handleSave = () => {
    onSaveUrl(inputUrl.trim());
  };

  const handleClear = () => {
    setInputUrl('');
    onSaveUrl('');
  };

  // Google Apps Script source code from the user
  const gasCode = `/**
 * 安琪拉烘焙工作室月餅訂購系統 - Google Apps Script 後端 API
 *
 * 支援「每日日期分頁」的動態資料庫設計。
 * 1. GET 請求：撈取「Menu」菜單與「當天日期（yyyy-MM-dd）工作表」中的訂單
 * 2. POST 請求：自動在當天第一筆訂單進來時建立日期分頁，並支援新增 (create)、修改 (update)、刪除 (delete) 訂單
 */

// 核心自我清理機制：自動偵測並從工作表中徹底刪除「甜度」與「冰塊」兩個舊欄位以對齊資料結構
function cleanSheetHeaders(sheet) {
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  if (data.length === 0) return;
  var headersLine = data[0].map(function(h) { return h ? h.toString().trim() : ""; });

  // 1. 若有舊的「飲料名稱」則重命名為「月餅口味」
  var drinkIdx = headersLine.indexOf("飲料名稱");
  if (drinkIdx !== -1) {
    sheet.getRange(1, drinkIdx + 1).setValue("月餅口味");
    headersLine[drinkIdx] = "月餅口味";
  }

  // 2. 刪除「甜度」欄位
  var sugarIdx = headersLine.indexOf("甜度");
  if (sugarIdx !== -1) {
    sheet.deleteColumn(sugarIdx + 1);
    cleanSheetHeaders(sheet); // 遞迴重新讀取以防索引位移
    return;
  }

  // 3. 刪除「冰塊」欄位
  var iceIdx = headersLine.indexOf("冰塊");
  if (iceIdx !== -1) {
    sheet.deleteColumn(iceIdx + 1);
    cleanSheetHeaders(sheet); // 遞迴重新讀取
    return;
  }
}

// 1. 處理 GET 請求：回傳菜單與「當天」的訂單
function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // (1) 取得 Menu 工作表資料
  const menuSheet = ss.getSheetByName("Menu");
  let menu = [];
  if (menuSheet) {
    const menuData = menuSheet.getDataRange().getValues();
    if (menuData.length > 1) {
      // 排除第一列標題，並對應到最新 Excel 欄位：
      // row[0] (月餅口味), row[1] (單價), row[2] (類別分類), row[3] (備註描述)
      menu = menuData.slice(1).map(row => {
        var name = row[0] ? row[0].toString().trim() : "";
        var price = parseFloat(row[1]) || 0;
        var category = row[2] ? row[2].toString().trim() : "";
        var description = "";
        var imageUrl = "";
        
        if (row[3]) {
          // Check if cell is an inline CellImage object
          if (typeof row[3] === 'object' && typeof row[3].getContentUrl === 'function') {
            try {
              imageUrl = row[3].getContentUrl() || "";
              description = row[3].getAltTextDescription() || "CellImage";
            } catch (e) {
              description = "CellImage";
            }
          } else {
            description = row[3].toString().trim();
            var urlMatch = description.match(/https?:\/\/[^\s]+/i);
            if (urlMatch) {
              imageUrl = urlMatch[0];
            }
          }
        }
        
        return {
          name: name,
          price: price,
          category: category,
          description: description,
          imageUrl: imageUrl
        };
      });
    }
  }

  // (2) 取得「當天日期命名」的訂單工作表資料
  const timezone = Session.getScriptTimeZone();
  const today = Utilities.formatDate(new Date(), timezone, "yyyy-MM-dd");
  const orderSheet = ss.getSheetByName(today);
  
  let orders = [];
  if (orderSheet) {
    // 呼叫自動清理機制，若存在「甜度」與「冰塊」舊欄位則立即刪除
    cleanSheetHeaders(orderSheet);

    const orderData = orderSheet.getDataRange().getValues();
    if (orderData.length > 1) {
      // 取得標題列並統一轉成文字以利比對
      var headersLine = orderData[0].map(function(h) { return h ? h.toString().trim() : ""; });
      
      var getIndex = function(possibleHeaders, defaultIdx) {
        for (var i = 0; i < headersLine.length; i++) {
          if (possibleHeaders.indexOf(headersLine[i]) !== -1) return i;
        }
        return defaultIdx;
      };

      var idIdx = getIndex(["訂單編號"], 0);
      var timeIdx = getIndex(["時間戳記"], 1);
      var nameIdx = getIndex(["訂購人"], 2);
      var productIdx = getIndex(["月餅口味", "飲料名稱"], 3);
      
      // 動態偵測「數量」與「總金額」及新的聯絡欄位
      var qtyIdx = getIndex(["數量"], 4);
      var valIdx = getIndex(["總金額"], 5);
      var phoneIdx = getIndex(["手機號碼", "手機"], -1);
      var emailIdx = getIndex(["電子信箱", "email", "e-mail", "電子郵件"], -1);
      var addressIdx = getIndex(["送貨地址", "收件地址", "地址"], -1);
      var deliveryDateIdx = getIndex(["送貨日期", "期望送貨日期", "送貨日"], -1);

      orders = orderData.slice(1).map(function(row) {
        return {
          orderId: row[idIdx] ? row[idIdx].toString().trim() : "",
          timestamp: row[timeIdx],
          name: row[nameIdx] ? row[nameIdx].toString().trim() : "",
          mooncakes: row[productIdx] ? row[productIdx].toString().trim() : "",
          quantity: parseInt(row[qtyIdx]) || 0,
          totalPrice: parseFloat(row[valIdx]) || 0,
          phone: phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx].toString().trim() : "",
          email: emailIdx !== -1 && row[emailIdx] ? row[emailIdx].toString().trim() : "",
          address: addressIdx !== -1 && row[addressIdx] ? row[addressIdx].toString().trim() : "",
          deliveryDate: deliveryDateIdx !== -1 && row[deliveryDateIdx] ? row[deliveryDateIdx].toString().trim() : ""
        };
      });
    }
  }

  // 包裝成 JSON 格式回傳
  return createJsonResponse({ menu: menu, orders: orders });
}

// 2. 處理 POST 請求：支援當日訂單之新增、修改、刪除
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const timezone = Session.getScriptTimeZone();
    const today = Utilities.formatDate(new Date(), timezone, "yyyy-MM-dd");
    
    let sheet = ss.getSheetByName(today);

    // 呼叫自動清理機制，若該工作表已存在且包含「甜度」與「冰塊」舊欄位則立即刪除
    if (sheet) {
      cleanSheetHeaders(sheet);
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action; // "create", "update", "delete"
    const data = payload.data;

    // ─── [新增訂單 (Create)] ───
    if (action === "create") {
      // 如果今天的工作表不存在，則在此時自動初始化建立！
      if (!sheet) {
        sheet = ss.insertSheet(today, 1); // 參數 1 代表將新工作表移到第一個分頁，方便每天打開第一眼看到
        const headers = ["訂單編號", "時間戳記", "訂購人", "月餅口味", "數量", "總金額", "手機號碼", "電子信箱", "送貨地址", "送貨日期"];
        sheet.appendRow(headers);
        
        // 美化工作表：凍結首列並加粗底色
        sheet.setFrozenRows(1);
        sheet.getRange(1, 1, 1, headers.length)
             .setFontWeight("bold")
             .setBackground("#e8f5e9") // 暖綠色背景相容月餅主題
             .setHorizontalAlignment("center");
      }

      const items = Array.isArray(data) ? data : [data];
      let orderIds = [];

      for (let j = 0; j < items.length; j++) {
        const item = items[j];
        const orderId = item.orderId || Utilities.getUuid(); // 產生或保留唯一的 UUID 作為訂單編號
        orderIds.push(orderId);
        
        // 依照欄位順序寫入：
        const newRow = [
          orderId,
          new Date(),
          item.name || "無名氏",
          item.mooncakes || "",
          parseInt(item.quantity) || 1,
          parseFloat(item.totalPrice) || 0,
          item.phone || "",
          item.email || "",
          item.address || "",
          item.deliveryDate || ""
        ];
        sheet.appendRow(newRow);
      }
      return createJsonResponse({ status: "success", message: "訂單已成功記錄至工作表 " + today, orderIds: orderIds });
    }

    // ─── 對於 [修改 (Update)] 與 [刪除 (Delete)] ───
    // 因為這兩者必須建立在「今天已有工作表」的前提下，否則無從修改/刪除
    if (!sheet) {
      throw new Error("今天 (" + today + ") 尚未有任何訂單，無法進行此操作。");
    }
    
    const orderData = sheet.getDataRange().getValues();

    // ─── [修改訂單 (Update)] ───
    if (action === "update") {
      if (!data.orderId) {
        throw new Error("修改訂單時缺少 'orderId' 參數");
      }

      for (let i = 1; i < orderData.length; i++) {
        if (orderData[i][0].toString().trim() === data.orderId.toString().trim()) {
          var headersLine = orderData[0].map(function(h) { return h ? h.toString().trim() : ""; });
          
          var updateCell = function(colName, value) {
            var colIdx = headersLine.indexOf(colName);
            if (colIdx === -1 && colName === "月餅口味") colIdx = headersLine.indexOf("飲料名稱");
            
            if (colIdx !== -1) {
              sheet.getRange(i + 1, colIdx + 1).setValue(value);
            }
          };

          updateCell("訂購人", data.name);
          updateCell("月餅口味", data.mooncakes);
          updateCell("數量", parseInt(data.quantity) || 1);
          updateCell("總金額", parseFloat(data.totalPrice) || 0);
          updateCell("手機號碼", data.phone || "");
          updateCell("電子信箱", data.email || "");
          updateCell("送貨地址", data.address || "");
          updateCell("送貨日期", data.deliveryDate || "");

          return createJsonResponse({ status: "success", message: "訂單更新成功！" });
        }
      }
      throw new Error("在今日 (" + today + ") 工作表中找不到該筆訂單編號：" + data.orderId);
    }

    // ─── [刪除訂單 (Delete)] ───
    if (action === "delete") {
      if (!data.orderId) {
        throw new Error("刪除訂單時缺少 'orderId' 參數");
      }

      for (let i = 1; i < orderData.length; i++) {
        if (orderData[i][0].toString().trim() === data.orderId.toString().trim()) {
          sheet.deleteRow(i + 1); // 刪除對應的列
          return createJsonResponse({ status: "success", message: "訂單已從 " + today + " 刪除成功！" });
        }
      }
      throw new Error("在今日 (" + today + ") 工作表中找不到該筆訂單編號：" + data.orderId);
    }

    throw new Error("未知的操作 (action 必須為 create, update 或 delete)");

  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

/**
 * 輔助函式：建立 JSON 回傳格式
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
                       .setMimeType(ContentService.MimeType.JSON);
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(gasCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md p-6 border border-natural-border mb-8 transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl transition-all ${gasUrl ? 'bg-emerald-50 text-emerald-600' : 'bg-natural-terracotta/10 text-natural-terracotta'}`}>
            <Database size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="serif text-lg font-bold text-[#2C2C2C]">後端資料庫連線設定</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                gasUrl 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                  : 'bg-[#5A5A40]/15 text-[#5A5A40] border border-natural-border'
              }`}>
                {gasUrl ? '● 雲端 Excel 模式' : '● 本地模擬器模式'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {gasUrl 
                ? '系統已連接至 Google Apps Script，訂單皆會即時寫入雲端 Google 試算表。' 
                : '目前運行於離線沙盒，訂單暫存在瀏覽器 localStorage 中，隨時可設定 GAS 連接雲端試算表。'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 bg-natural-header hover:bg-[#F9F6F0] px-4 py-2.5 rounded-xl border border-natural-border transition-all cursor-pointer"
        >
          {isOpen ? '收合設定與教學' : '展開 Google 試算表設定教學'}
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <div className={`overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-[1450px] mt-6 pt-6 border-t border-natural-border opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="space-y-4">
            <h3 className="serif text-sm font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Settings size={16} className="text-natural-accent" /> API 連線網址設定
            </h3>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500">
                Google Apps Script (GAS) 部署為網路應用程式後產生的 URL
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="請貼入您的 Google Apps Script 網址 (https://script.google.com/...)"
                  className="flex-1 px-4 py-3 bg-natural-header border border-natural-border rounded-xl text-sm font-mono focus:outline-none focus:ring-1 focus:ring-natural-terracotta transition-all text-slate-700"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={!inputUrl.trim() || inputUrl.trim() === gasUrl}
                    className="sm:px-4 py-3 bg-natural-terracotta hover:opacity-90 text-white font-semibold text-xs sm:text-sm rounded-xl disabled:opacity-50 flex-1 sm:flex-none transition-all cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    儲存網址
                  </button>
                  {gasUrl && (
                    <button
                      onClick={handleClear}
                      className="px-4 py-3 bg-white text-natural-accent font-semibold text-xs sm:text-sm rounded-xl border border-natural-border hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
                    >
                      還原模擬器
                    </button>
                  )}
                </div>
              </div>
            </div>

            {gasUrl && (
              <div className="p-4 bg-[#F9F6F0]/30 rounded-xl border border-natural-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">連線功能測試</span>
                  <button
                    onClick={onTestConnection}
                    disabled={isTestingUrl}
                    className="flex items-center gap-1.5 text-xs font-bold text-natural-accent hover:opacity-85 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw size={14} className={isTestingUrl ? 'animate-spin' : ''} />
                    {isTestingUrl ? '測試中...' : '立即測試 API 狀態'}
                  </button>
                </div>

                {testSuccess && (
                  <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                    <CheckCircle size={14} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">測試成功！已成功握手連線。</p>
                      <p className="opacity-90 mt-0.5">試算表正在成功寫入與讀取最新 Menu/Orders 數據。</p>
                    </div>
                  </div>
                )}

                {testError && (
                  <div className="flex items-start gap-2 text-xs text-rose-800 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">連線測試失敗</p>
                      <p className="opacity-90 mt-0.5">原因是：{testError}</p>
                      <ul className="list-disc list-inside mt-1 opacity-80 pl-1 space-y-0.5">
                        <li>確認 Apps Script 已部署為「網路應用程式」</li>
                        <li>「具有存取權的使用者」請選擇「所有人（Anyone）」</li>
                        <li>確認是否已完成 CORS 跨網域授權設定</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 bg-[#F9F6F0]/60 rounded-xl border border-natural-border text-xs text-slate-650 space-y-2">
              <div className="flex items-center gap-1.5 text-natural-terracotta font-bold font-serif">
                <Info size={14} className="shrink-0" />
                <span>❓ 甚麼是每日日期分頁功能？</span>
              </div>
              <p className="leading-relaxed">
                本系統包含超貼心的<b>「每日一頁」</b>資料庫設計。每天的第一筆訂單送出時，GAS 後端會自動在您的 Google 試算表中建立一個以當天日期命名的工作表分頁（例如 <code>2026-05-29</code>），並將當天訂單整齊地保存在獨立分頁，方便主辦人按天管理與核對帳目！
              </p>
            </div>
          </div>

          {/* Guide Steps */}
          <div className="space-y-4">
            <h3 className="serif text-sm font-bold text-[#2C2C2C] flex items-center gap-1.5 uppercase tracking-wider">
              <ExternalLink size={16} className="text-natural-accent" /> 4 步快速雲端架設
            </h3>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 bg-natural-accent/10 border border-natural-accent/20 text-[#5A5A40] font-bold rounded-full text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-semibold text-slate-800">建立 Google 試算表</p>
                  <p className="text-slate-500 mt-0.5">新增一張試算表，新增一個名為 <code>Menu</code> 的工作表分頁（務必大小寫相符）。</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 bg-natural-accent/10 border border-natural-accent/20 text-[#5A5A40] font-bold rounded-full text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-semibold text-slate-800">填入預設月餅菜單 (在 Menu 分頁中)</p>
                  <p className="text-slate-500 mt-0.5">
                    在 Menu 第一列填入標題：<code>A: 月餅口味、B: 單價、C: 類別分類、D: 備註描述</code>。接著在下方填寫您想開放訂購的月餅款式與售價。
                    <br />
                    <span className="text-natural-terracotta font-medium mt-1 inline-block">💡 <b>如何更換為自訂月餅圖片？</b> 如果您不想使用系統預設的食物照片，請將自訂圖片的公開網址（例如來自 Imgur、Unsplash、Giphy 等以 <code>http://</code> 或 <code>https://</code> 開頭的圖片網址）直接以 <b>文字格式</b> 填入 D 欄「備註描述」中。
                    <br />
                    <span className="text-rose-600 font-bold mt-1 inline-block">🚨 貼心提醒（重要）：</span>請勿在 Google 試算表中使用「插入 ＞ 儲存格內圖片」功能，這會導致 Google 內部回傳不包含網址的 <code>CellImage</code> 欄位，致使系統無法讀取網址。<b>請務必直接以【純文字】方式貼上圖片網址（例如 <code>https://i.imgur.com/xxxxxx.jpg</code>）</b>，網頁就能完美載入您自訂的精美月餅圖片囉！</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 bg-natural-accent/10 border border-natural-accent/20 text-[#5A5A40] font-bold rounded-full text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-semibold text-slate-800">貼入 Google Apps Script 程式碼</p>
                  <p className="text-slate-500 mt-0.5">點擊試算表選單上的 <code>擴充功能 &gt; Apps Script</code>，清除內建的預設 function，將右方的精美後端程式碼貼上，按下儲存。</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 bg-natural-accent/10 border border-natural-accent/20 text-[#5A5A40] font-bold rounded-full text-[10px] shrink-0 mt-0.5">4</span>
                <div>
                  <p className="font-semibold text-slate-800">部署為網路應用程式與連線</p>
                  <p className="text-slate-500 mt-0.5">
                    點選右上角 <code>部署 &gt; 新增部署 &gt; 網頁應用程式</code>。<br />
                    - 設定專案帳戶為「您的 Google 帳戶」<br />
                    - 誰有權限存取選<b>「所有人 (Anyone)」</b>以免阻擋 Cors 機制。<br />
                    按部署並通過權限認證，複製產生的 <b>網頁應用程式 URL</b>，貼到左側輸入框按儲存即可！
                  </p>
                </div>
              </div>
            </div>

            {/* Code copying preview */}
            <div className="mt-4 pt-4 border-t border-natural-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">GAS 後端腳本程式碼</span>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-xs font-semibold text-natural-accent bg-natural-accent/10 hover:bg-natural-accent/15 px-2.5 py-1.5 rounded-lg border border-natural-border transition-all cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copied ? '已複製！' : '一鍵複製程式碼'}
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto rounded-xl bg-[#2C2C2C] p-3 select-all font-mono text-[10px] leading-relaxed text-slate-300">
                <pre>{gasCode}</pre>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
