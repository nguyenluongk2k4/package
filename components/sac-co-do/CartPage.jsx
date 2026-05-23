"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TemplateFrame from "./TemplateFrame";
import { getCart, updateCartQuantity, removeFromCart, createOrder, formatPrice } from "../../lib/db";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [form, setForm] = useState({
    fullname: "",
    phone: "",
    address: "",
    note: "",
    paymentMethod: "cod", // "cod" | "transfer"
  });
  const [placedOrder, setPlacedOrder] = useState(null);

  useEffect(() => {
    setCart(getCart());
  }, []);

  const handleQtyChange = (id, newQty) => {
    const updated = updateCartQuantity(id, newQty);
    setCart(updated);
  };

  const handleRemove = (id) => {
    const updated = removeFromCart(id);
    setCart(updated);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    const order = createOrder(form, cart);
    setPlacedOrder(order);
    setCart([]);
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCartPriceFormatted = formatPrice(totalCartPrice);

  return (
    <TemplateFrame>
      <InnerBanner />
      <section className="bg-white py-20 relative text-primary">
        <div className="container">
          {placedOrder ? (
            <OrderSuccessView order={placedOrder} />
          ) : cart.length === 0 ? (
            <EmptyCartView />
          ) : (
            <div className="grid grid-cols-12 gap-10">
              {/* Left Column: Cart list */}
              <div className="lg:col-span-7 col-span-12">
                <h3 className="text-2xl font-bold mb-7.5 border-b border-primary/10 pb-3">
                  Sản phẩm trong giỏ ({cart.length})
                </h3>
                <div className="space-y-5">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 border border-primary/10 rounded-2xl flex items-center justify-between gap-5 flex-wrap sm:flex-nowrap bg-[rgba(41,137,145,0.02)]"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="size-20 object-cover rounded-xl border border-primary/10"
                        />
                        <div>
                          <span className="font-bold text-lg block">{item.name}</span>
                          <span className="text-sm text-primary/60">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 max-sm:w-full max-sm:justify-between">
                        {/* Qty increment */}
                        <div className="flex items-center bg-white rounded-lg border border-primary/10 overflow-hidden size-fit">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                            className="px-3 py-1 hover:bg-paleaqua/30 font-bold text-sm duration-300"
                          >
                            -
                          </button>
                          <span className="px-4 font-bold text-sm">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                            className="px-3 py-1 hover:bg-paleaqua/30 font-bold text-sm duration-300"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className="text-red-500 hover:text-red-700 text-xl duration-300"
                          aria-label="Xóa sản phẩm"
                        >
                          <i className="fa-solid fa-trash-can" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Checkout Form (mượn input class từ contact.html) */}
              <div className="lg:col-span-5 col-span-12">
                <div className="bg-lightturquoise/20 p-7.5 border border-paleaqua rounded-3xl shadow-[0px_4px_30px_rgba(41,137,145,0.05)]">
                  <h3 className="text-xl font-bold mb-5 border-b border-primary/10 pb-2">
                    Thông tin giao hàng & Thanh toán
                  </h3>
                  <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="fullname" className="text-xs font-semibold uppercase text-primary/70 block mb-1.5 ml-2">
                        Họ và tên người nhận:
                      </label>
                      <input
                        type="text"
                        id="fullname"
                        name="fullname"
                        required
                        value={form.fullname}
                        onChange={handleInputChange}
                        className="block w-full sm:h-16 h-12 rounded-5xl border border-primary/20 sm:px-6 px-4 text-primary bg-white outline-0 placeholder:text-primary/30 text-sm focus:border-primary duration-300"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="text-xs font-semibold uppercase text-primary/70 block mb-1.5 ml-2">
                        Số điện thoại:
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        value={form.phone}
                        onChange={handleInputChange}
                        className="block w-full sm:h-16 h-12 rounded-5xl border border-primary/20 sm:px-6 px-4 text-primary bg-white outline-0 placeholder:text-primary/30 text-sm focus:border-primary duration-300"
                        placeholder="09xxxxxxxx"
                      />
                    </div>

                    <div>
                      <label htmlFor="address" className="text-xs font-semibold uppercase text-primary/70 block mb-1.5 ml-2">
                        Địa chỉ nhận hàng:
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        required
                        value={form.address}
                        onChange={handleInputChange}
                        className="block w-full sm:h-16 h-12 rounded-5xl border border-primary/20 sm:px-6 px-4 text-primary bg-white outline-0 placeholder:text-primary/30 text-sm focus:border-primary duration-300"
                        placeholder="Số nhà, Tên đường, Quận, Thành phố"
                      />
                    </div>

                    <div>
                      <label htmlFor="note" className="text-xs font-semibold uppercase text-primary/70 block mb-1.5 ml-2">
                        Ghi chú đơn hàng:
                      </label>
                      <input
                        type="text"
                        id="note"
                        name="note"
                        value={form.note}
                        onChange={handleInputChange}
                        className="block w-full sm:h-16 h-12 rounded-5xl border border-primary/20 sm:px-6 px-4 text-primary bg-white outline-0 placeholder:text-primary/30 text-sm focus:border-primary duration-300"
                        placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                      />
                    </div>

                    {/* Payment methods */}
                    <div className="pt-2">
                      <span className="text-xs font-semibold uppercase text-primary/70 block mb-2.5 ml-2">
                        Phương thức thanh toán:
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`p-3.5 border rounded-2xl cursor-pointer text-center duration-300 block ${
                          form.paymentMethod === "cod" ? "border-primary bg-white font-bold" : "border-primary/10 bg-white/40"
                        }`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cod"
                            checked={form.paymentMethod === "cod"}
                            onChange={handleInputChange}
                            className="hidden"
                          />
                          <span>COD (Nhận hàng trả tiền)</span>
                        </label>
                        <label className={`p-3.5 border rounded-2xl cursor-pointer text-center duration-300 block ${
                          form.paymentMethod === "transfer" ? "border-primary bg-white font-bold" : "border-primary/10 bg-white/40"
                        }`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="transfer"
                            checked={form.paymentMethod === "transfer"}
                            onChange={handleInputChange}
                            className="hidden"
                          />
                          <span>Chuyển khoản (Có mã QR)</span>
                        </label>
                      </div>
                    </div>

                    {/* Dynamic Bank details info */}
                    {form.paymentMethod === "transfer" && (
                      <div className="bg-white p-4.5 rounded-2xl border border-primary/10 space-y-2 mt-4 text-sm">
                        <span className="font-bold text-secondary text-base block border-b border-primary/5 pb-1">
                          Thông tin chuyển khoản:
                        </span>
                        <div className="flex gap-4 items-center">
                          <div className="flex-1 space-y-1">
                            <div>Ngân hàng: <b>MB Bank (Quân Đội)</b></div>
                            <div>Số TK: <b>970422998888</b></div>
                            <div>Chủ TK: <b>DỰ ÁN SẮC CỐ ĐÔ</b></div>
                            <div className="text-xs text-red-500 font-bold mt-1.5">
                              Nội dung: Chuyển khoản đơn hàng Sắc Cố Đô
                            </div>
                          </div>
                          <div className="size-20 bg-paleaqua/30 border border-primary/5 rounded-xl flex items-center justify-center text-primary/40 font-mono text-center text-xs p-1">
                            QR Chuyển Khoản
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-5 border-t border-primary/10 mt-5">
                      <div className="flex justify-between items-center mb-5 font-bold text-lg">
                        <span>Tổng chi phí:</span>
                        <span className="text-2xl text-secondary">{totalCartPriceFormatted}</span>
                      </div>
                      <button
                        type="submit"
                        className="site-button butn-bg-shape w-full py-4 text-center justify-center font-bold"
                      >
                        Đặt hàng ngay
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </TemplateFrame>
  );
}

function EmptyCartView() {
  return (
    <div className="text-center py-20 max-w-115 mx-auto">
      <div className="size-24 bg-paleaqua/30 text-primary/40 rounded-full flex items-center justify-center text-4xl mx-auto mb-7.5">
        <i className="fa-solid fa-cart-shopping" />
      </div>
      <h3 className="text-2xl font-bold mb-3">Giỏ hàng của bạn đang trống!</h3>
      <p className="text-primary/70 mb-7.5">
        Hãy quay lại trang sản phẩm để chọn cho mình cuốn sổ Pop-up passport di sản Ninh Bình và các gói combo tiết kiệm nhé.
      </p>
      <Link href="/san-pham" className="site-button butn-bg-shape">
        Quay lại chọn gói sản phẩm
      </Link>
    </div>
  );
}

function OrderSuccessView({ order }) {
  const totalFormatted = formatPrice(order.total);

  return (
    <div className="max-w-180 mx-auto bg-lightturquoise/10 border border-paleaqua p-8 sm:p-12.5 rounded-3xl text-center shadow-md">
      <div className="size-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-5 animate-pulse">
        <i className="fa-solid fa-circle-check" />
      </div>
      <h3 className="text-3xl font-black text-emerald-700 mb-2">Đặt hàng thành công!</h3>
      <p className="text-primary/80 mb-6.25">
        Cảm ơn bạn đã lựa chọn **Sắc Cố Đô**. Đơn hàng của bạn đã được ghi nhận trên hệ thống cơ sở dữ liệu.
      </p>

      <div className="bg-white rounded-2xl p-6 border border-primary/5 text-left mb-7.5 space-y-2.5 shadow-sm text-sm">
        <div>Mã đơn hàng: <b className="text-secondary font-mono">{order.id}</b></div>
        <div>Người nhận: <b>{order.customer.fullname}</b></div>
        <div>Số điện thoại: <b>{order.customer.phone}</b></div>
        <div>Địa chỉ nhận: <b>{order.customer.address}</b></div>
        <div>Tổng tiền thanh toán: <b className="text-secondary text-base">{totalFormatted}</b></div>
        <div>Phương thức thanh toán: <b>{order.customer.paymentMethod === "cod" ? "COD (Giao hàng thu tiền)" : "Chuyển khoản ngân hàng"}</b></div>
      </div>

      {order.customer.paymentMethod === "transfer" && (
        <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-citrusyellow max-w-135 mx-auto mb-8.75 text-center">
          <span className="font-bold text-secondary block mb-2.5">
            Quét mã QR để hoàn tất thanh toán chuyển khoản:
          </span>
          {/* A simulated QR code box using CSS gradient and custom content */}
          <div className="size-48 bg-gradient-to-tr from-primary to-secondary p-1 rounded-2xl mx-auto mb-3.75 shadow-md flex items-center justify-center">
            <div className="bg-white size-full rounded-xl flex items-center justify-center p-3">
              <div className="size-full bg-cover bg-[url(/assets/images/favicon.png)] border-4 border-emerald-500/20 rounded-md relative flex items-center justify-center">
                <span className="bg-white/90 text-primary text-2xs px-2 py-1 rounded font-bold uppercase tracking-wider font-mono">
                  MB BANK: 970422998888
                </span>
              </div>
            </div>
          </div>
          <div className="text-xs text-primary/70">
            Hệ thống sẽ tự động quét biến động số dư và gửi bưu kiện kèm mã kích hoạt **SCD-XXXXX** tới bạn ngay khi giao dịch thành công.
          </div>
        </div>
      )}

      <div className="space-y-4 max-w-115 mx-auto pt-5 border-t border-primary/10">
        <p className="text-sm text-primary/60">
          Sau khi nhận được sổ giấy, bạn hãy truy cập vào trang Kích hoạt bên dưới để mở khóa tiến độ check-in di sản Ninh Bình.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/kich-hoat" className="site-button butn-bg-shape flex-1 text-center justify-center">
            Đi đến Kích Hoạt Sổ
          </Link>
          <Link href="/hanh-trinh" className="sac-outline-button flex-1 text-center justify-center">
            Xem bản đồ 6 trạm
          </Link>
        </div>
      </div>
    </div>
  );
}

function InnerBanner() {
  return (
    <div className="relative bg-cover bg-center w-full bg-white bg-[url(../images/background/inr-banner.jpg)] overflow-hidden sac-inner-banner">
      <div className="flex w-full lg:h-160 md:h-135 h-100 pb-10 items-baseline mx-auto">
        <div className="relative md:mt-60 mt-45 flex items-center justify-center w-full flex-col z-5">
          <div>
            <h1 className="lg:text-60 md:text-52 text-28 relative">Giỏ Hàng Của Bạn</h1>
          </div>
          <div>
            <ul className="inline-block">
              <li className="text-base pr-7.5 relative inline-block font-semibold text-primary after:content-['-'] after:absolute after:right-2 after:-top-1.5 after:text-primary after:text-26 after:font-normal">
                <Link href="/">Trang chủ</Link>
              </li>
              <li className="relative inline-block text-base font-semibold text-primary">Giỏ hàng & Đặt hàng</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="h-50 w-full absolute top-50 left-0 z-1">
        <div className="inline-block whitespace-nowrap animate-moveCloud">
          <img src="/assets/images/inr-banner-cloud.png" alt="" className="h-47.5" />
        </div>
      </div>
      <div className="absolute w-1/2 right-0 top-0 bottom-0 z-1">
        <div className="mt-60 animate-slide-right">
          <img src="/assets/images/airplane.png" alt="" className="animate-slide-top-fast" width="378" height="146" />
        </div>
      </div>
      <div className="absolute right-11.25 bottom-16.25 animate-slide-top2">
        <img src="/assets/images/hotballon-Left.png" alt="" className="md:w-21 w-10" width="84" height="121" />
      </div>
      <div className="absolute md:-right-15 -right-10 top-41.25 animate-slide-top">
        <img src="/assets/images/hotballon-right.png" alt="" className="md:w-37.5 w-20" width="230" height="333" />
      </div>
    </div>
  );
}
