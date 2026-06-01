/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mooncake, Order } from '../types';

export const DEFAULT_MENU: Mooncake[] = [
  { 
    name: "蛋黃酥6粒裝禮盒", 
    price: 500, 
    category: "6粒裝(含包裝外盒)", 
    description: "香酥千層外皮包裹飽滿手烤高粱鹹蛋黃，搭配綿密紅豆沙，外酥內軟。",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e5/%E8%9B%8B%E9%BB%83%E9%85%A5_Egg_yolk_pastry.jpg"
  },
  { 
    name: "綠豆椪6粒裝禮盒", 
    price: 400, 
    category: "6粒裝(含包裝外盒)", 
    description: "傳統古法製作，雪白千層酥皮包裹頂級綠豆沙內餡，入口即化，清甜不膩。",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Mung_bean_pastries_0831.jpg"
  },
  { 
    name: "滷肉綠豆椪6粒裝", 
    price: 450, 
    category: "6粒裝(含包裝外盒)", 
    description: "香濃綿密綠豆沙與精心熬煮台灣古早味鹹香滷肉，鹹甜交織，經典雋永。",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Mung_bean_pastries_0831.jpg"
  },
  { 
    name: "金莎綠豆椪6粒裝", 
    price: 450, 
    category: "6粒裝(含包裝外盒)", 
    description: "細緻微甜綠豆蓉與嚴選整顆黃金金沙鹹蛋黃碎，鹹甜層次分明，香氣四溢。",
    imageUrl: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=400"
  },
  { 
    name: "帝王酥6粒裝禮盒", 
    price: 600, 
    category: "6粒裝(含包裝外盒)", 
    description: "多層次厚實外皮，內裹滑順白蓮蓉、夏威夷豆、手工烤蛋黃與軟糯麻糬，尊榮享受。",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400"
  },
  { 
    name: "鳳梨酥6粒裝禮盒", 
    price: 400, 
    category: "6粒裝(含包裝外盒)", 
    description: "金黃香酥奶香外皮，包裹黃金比例微酸關廟鳳梨酥內餡，纖維豐富，香甜可口。",
    imageUrl: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=400"
  },
  { 
    name: "綜合禮盒", 
    price: 600, 
    category: "2粒帝王酥 & 2粒金砂 & 2粒蛋黃酥", 
    description: "一次收藏多款高人氣中秋月餅口味，送禮自用兩相宜。",
    imageUrl: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=400"
  }
];

export const INITIAL_MOCK_ORDERS: Order[] = [
  {
    orderId: "mock-order-001",
    timestamp: "2026-05-29T09:12:00.000Z",
    name: "陳怡君 (HR)",
    mooncakes: "蛋黃酥6粒裝禮盒",
    quantity: 2,
    totalPrice: 1000
  },
  {
    orderId: "mock-order-002",
    timestamp: "2026-05-29T10:05:00.000Z",
    name: "黃建宏 (Engineering)",
    mooncakes: "金莎綠豆椪6粒裝",
    quantity: 1,
    totalPrice: 450
  },
  {
    orderId: "mock-order-003",
    timestamp: "2026-05-29T11:45:00.000Z",
    name: "李美玲 (Sales)",
    mooncakes: "綠豆椪6粒裝禮盒",
    quantity: 1,
    totalPrice: 400
  },
  {
    orderId: "mock-order-004",
    timestamp: "2026-05-29T13:20:00.000Z",
    name: "張雅婷 (Design)",
    mooncakes: "綜合禮盒",
    quantity: 3,
    totalPrice: 1800
  },
  {
    orderId: "mock-order-005",
    timestamp: "2026-05-29T14:15:00.000Z",
    name: "王宇航 (Marketing)",
    mooncakes: "帝王酥6粒裝禮盒",
    quantity: 2,
    totalPrice: 1200
  }
];

export const convertGoogleDriveUrl = (url: string): string => {
  if (!url) return url;
  
  // Match standard Google Drive file/d/ID/view or open?id=ID styles
  let fileId = '';
  const fileDMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileDMatch && fileDMatch[1]) {
    fileId = fileDMatch[1];
  } else {
    const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
    if (idParamMatch && idParamMatch[1]) {
      fileId = idParamMatch[1];
    }
  }
  
  if (fileId) {
    // Return direct, cookie-free and redirect-free high-resolution image endpoint (sz=w1000 ensures supreme quality)
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }
  return url;
};

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const img = e.currentTarget;
  const currentSrc = img.src;
  
  // If a legacy Google Drive direct embed style link failed due to cross-site cookie settings, fallback to the thumbnail variant
  if (currentSrc.includes('drive.google.com') && !currentSrc.includes('thumbnail')) {
    let fileId = '';
    const fileDMatch = currentSrc.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (fileDMatch && fileDMatch[1]) {
      fileId = fileDMatch[1];
    } else {
      const idParamMatch = currentSrc.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
      if (idParamMatch && idParamMatch[1]) {
        fileId = idParamMatch[1];
      }
    }
    if (fileId) {
      img.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
      return;
    }
  }
  
  // Final fallback to beautiful pastries of Unsplash
  img.src = 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=400';
};

export const cleanDescription = (desc?: string): string => {
  if (!desc) return "";
  if (desc.trim().toLowerCase() === 'cellimage') return "";
  
  // Clean off raw image links (e.g. http://... or https://...) from description text
  return desc.replace(/https?:\/\/[^\s\u4e00-\u9fa5]+/gi, '').trim();
};

export const getMooncakeImage = (item?: { name: string; imageUrl?: string; description?: string }) => {
  const fallback = 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=400';
  if (!item) return fallback;

  // 1. Check imageUrl for any valid HTTP/HTTPS link - ABSOLUTE PRIORITY
  if (item.imageUrl) {
    const urlMatch = item.imageUrl.trim().match(/https?:\/\/[^\s\u4e00-\u9fa5]+/i);
    if (urlMatch) {
      return convertGoogleDriveUrl(urlMatch[0]);
    }
  }
  
  // 2. Check description column (often used as dynamic notes or where direct links are pasted) - ABSOLUTE PRIORITY
  if (item.description) {
    const urlMatch = item.description.trim().match(/https?:\/\/[^\s\u4e00-\u9fa5]+/i);
    if (urlMatch) {
      return convertGoogleDriveUrl(urlMatch[0]);
    }
  }

  // 3. Check name column in case the URL was accidentally pasted as the name
  if (item.name) {
    const urlMatch = item.name.trim().match(/https?:\/\/[^\s\u4e00-\u9fa5]+/i);
    if (urlMatch) {
      return convertGoogleDriveUrl(urlMatch[0]);
    }
  }

  const name = item.name || '';
  
  // 4. Fallback name-based matching for traditional Taiwanese pastries to provide beautiful default imagery if no spreadsheet URL was provided.
  if (name.includes('蛋黃酥')) {
    // Elegant close-up of shiny golden egg yolk pastries topped with black sesame seeds on a wooden plate
    return 'https://upload.wikimedia.org/wikipedia/commons/e/e5/%E8%9B%8B%E9%BB%83%E9%85%A5_Egg_yolk_pastry.jpg';
  }
  if (name.includes('綠豆椪') || name.includes('綠豆')) {
    // Beautiful authentic Taiwanese mung-bean pastry with the traditional red stamp on top (NOT the green bean plant!)
    return 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Mung_bean_pastries_0831.jpg';
  }
  if (name.includes('帝王酥')) {
    // Elegant layered traditional mooncakes/pastries representing Emperor Pastry
    return 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=400';
  }
  if (name.includes('鳳梨') || name.includes('鳳梨酥')) {
    // Outstanding professional photo of square golden-brown Taiwanese Pineapple Cakes arranged beautifully on a plate
    return 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=400';
  }
  if (name.includes('綜合')) {
    // Glorious high-tea presentation of multiple traditional mooncakes and pastries served with tea
    return 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=400';
  }
  
  // 5. General fallback mooncake image (beautiful flower pastries)
  return fallback;
};
