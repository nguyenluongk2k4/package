// lib/db.js
// SSR-safe LocalStorage Database layer for Sắc Cố Đô (Cart, Orders, Activation, Check-ins)

const KEYS = {
  CART: "scd_cart",
  ORDERS: "scd_orders",
  ACTIVATED_PASSPORTS: "scd_activated_passports",
  ACTIVE_PASSPORT: "scd_active_passport",
  CHECKINS: "scd_checkins",
};

// Safe wrapper to check window availability
function getLocalStorage() {
  if (typeof window !== "undefined") {
    return window.localStorage;
  }
  return null;
}

// Read from Storage
function read(key, defaultValue) {
  const storage = getLocalStorage();
  if (!storage) return defaultValue;
  try {
    const data = storage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error("Error reading LocalStorage for key " + key, e);
    return defaultValue;
  }
}

// Write to Storage
function write(key, value) {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Error writing LocalStorage for key " + key, e);
  }
}

// ==================== CART OPERATIONS ====================
export function getCart() {
  return read(KEYS.CART, []);
}

export function addToCart(packageItem, quantity = 1) {
  const cart = getCart();
  const existingItemIndex = cart.findIndex((item) => item.id === packageItem.id);

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({
      id: packageItem.id,
      name: packageItem.name,
      price: packageItem.price,
      priceFormatted: packageItem.priceFormatted,
      image: packageItem.image,
      quantity: quantity,
    });
  }
  write(KEYS.CART, cart);
  // Dispatch a custom event to notify header/cart badge about the update
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
  return cart;
}

export function updateCartQuantity(packageId, quantity) {
  let cart = getCart();
  if (quantity <= 0) {
    cart = cart.filter((item) => item.id !== packageId);
  } else {
    const item = cart.find((item) => item.id === packageId);
    if (item) {
      item.quantity = quantity;
    }
  }
  write(KEYS.CART, cart);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
  return cart;
}

export function removeFromCart(packageId) {
  let cart = getCart();
  cart = cart.filter((item) => item.id !== packageId);
  write(KEYS.CART, cart);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
  return cart;
}

export function clearCart() {
  write(KEYS.CART, []);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
}

// ==================== ORDER OPERATIONS ====================
export function getOrders() {
  return read(KEYS.ORDERS, []);
}

export function createOrder(customerInfo, cartItems) {
  const orders = getOrders();
  const orderId = `SCD-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const newOrder = {
    id: orderId,
    customer: customerInfo,
    items: cartItems,
    total: total,
    status: "Chờ thanh toán",
    createdAt: new Date().toISOString(),
  };

  orders.push(newOrder);
  write(KEYS.ORDERS, orders);
  clearCart();
  return newOrder;
}

// ==================== PASSPORT ACTIVATION ====================
export function getActivatedPassports() {
  return read(KEYS.ACTIVATED_PASSPORTS, []);
}

export function getActivePassport() {
  return read(KEYS.ACTIVE_PASSPORT, null);
}

export function activatePassport(code) {
  // Check if code is valid SCD-XXXXX
  const trimmed = code.trim().toUpperCase();
  const regex = /^SCD-[A-Z0-9]{5}$/;
  if (!regex.test(trimmed)) {
    return { success: false, message: "Mã kích hoạt không đúng định dạng. Vui lòng nhập dạng SCD-XXXXX." };
  }

  const activatedList = getActivatedPassports();
  if (activatedList.includes(trimmed)) {
    // Already activated before, let them resume it
    write(KEYS.ACTIVE_PASSPORT, trimmed);
    return { success: true, message: "Khôi phục hành trình cuốn sổ thành công!", code: trimmed };
  }

  activatedList.push(trimmed);
  write(KEYS.ACTIVATED_PASSPORTS, activatedList);
  write(KEYS.ACTIVE_PASSPORT, trimmed);
  return { success: true, message: "Kích hoạt mã sổ Sắc Cố Đô thành công!", code: trimmed };
}

export function isPassportActivated() {
  return getActivePassport() !== null;
}

// ==================== STATION CHECK-INS ====================
export function getCheckins() {
  // Returns checked-in station list for current passport
  const passport = getActivePassport();
  if (!passport) return [];
  const allCheckins = read(KEYS.CHECKINS, {});
  return allCheckins[passport] || [];
}

export function checkinStation(stationId, dailyCode) {
  const passport = getActivePassport();
  if (!passport) {
    return { success: false, message: "Vui lòng kích hoạt ID sổ trước khi thực hiện check-in." };
  }

  // Validate Daily Code (format: DDMM, e.g., May 23 is "2305")
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const correctCode = `${day}${month}`;

  if (dailyCode.trim() !== correctCode && dailyCode.trim() !== "9999") { // Allow "9999" as a master bypass for testing/QA
    return { success: false, message: "Mã ngày không chính xác. Vui lòng kiểm tra mã được trưng bày tại trạm." };
  }

  const allCheckins = read(KEYS.CHECKINS, {});
  const myCheckins = allCheckins[passport] || [];

  if (myCheckins.includes(stationId)) {
    return { success: true, message: "Trạm này đã được check-in trước đó!", alreadyCheckedin: true };
  }

  myCheckins.push(stationId);
  allCheckins[passport] = myCheckins;
  write(KEYS.CHECKINS, allCheckins);
  
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("checkin-updated"));
  }

  return { success: true, message: "Check-in thành công! Bạn đã mở khóa đóng dấu tại trạm này.", alreadyCheckedin: false };
}

export function getJourneyProgress() {
  const myCheckins = getCheckins();
  const total = 6;
  const completed = myCheckins.length;
  const percent = Math.round((completed / total) * 100);

  return {
    completed,
    total,
    percent,
    isCompletedAll: completed === total,
  };
}

export function resetDatabase() {
  write(KEYS.CART, []);
  write(KEYS.ORDERS, []);
  write(KEYS.ACTIVATED_PASSPORTS, []);
  write(KEYS.ACTIVE_PASSPORT, null);
  write(KEYS.CHECKINS, {});
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
    window.dispatchEvent(new Event("checkin-updated"));
  }
}

export function formatPrice(price) {
  if (typeof price !== "number") return "0đ";
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}
