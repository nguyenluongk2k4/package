import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, FieldValue } from "../../../../lib/server/firebase-admin";
import { buildSePayCheckoutPayload, isSePayConfigured } from "../../../../lib/server/sepay";

export const runtime = "nodejs";

function getBearerToken(request) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return "";
  return header.slice(7).trim();
}

export async function POST(request) {
  try {
    if (!isSePayConfigured()) {
      return NextResponse.json(
        { error: "SePay chua duoc cau hinh tren server. Can them env merchant, secret va app URL." },
        { status: 500 }
      );
    }

    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "Missing Firebase bearer token." }, { status: 401 });
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(token);
    const body = await request.json().catch(() => null);
    const orderId = String(body?.orderId || "").trim();

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
    }

    const db = getAdminDb();
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnapshot = await orderRef.get();

    if (!orderSnapshot.exists) {
      return NextResponse.json({ error: "Khong tim thay don hang." }, { status: 404 });
    }

    const order = { id: orderSnapshot.id, ...orderSnapshot.data() };

    if (order.userId !== decoded.uid) {
      return NextResponse.json({ error: "Ban khong co quyen khoi tao thanh toan cho don nay." }, { status: 403 });
    }

    if (order.paymentMethod !== "sepay") {
      return NextResponse.json({ error: "Don hang nay khong su dung SePay." }, { status: 409 });
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json({ error: "Don hang nay da duoc thanh toan." }, { status: 409 });
    }

    if (order.orderStatus === "cancelled" || order.orderStatus === "completed") {
      return NextResponse.json({ error: "Don hang khong con o trang thai co the thanh toan." }, { status: 409 });
    }

    const { checkoutUrl, fields, metadata } = buildSePayCheckoutPayload({ order });
    const existingSePay = order.sepay || {};

    await orderRef.set(
      {
        updatedAt: FieldValue.serverTimestamp(),
        sepay: {
          ...existingSePay,
          paymentGateway: "sepay",
          checkoutStatus: "ready",
          orderInvoiceNumber: metadata.orderInvoiceNumber,
          customData: metadata.customData,
          paymentMethodCode: metadata.paymentMethodCode,
          successUrl: metadata.successUrl,
          errorUrl: metadata.errorUrl,
          cancelUrl: metadata.cancelUrl,
          checkoutRequestedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    await orderRef.collection("events").add({
      type: "sepay_checkout_ready",
      message: "Khoi tao phien thanh toan SePay",
      actorUid: decoded.uid,
      actorRole: "user",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      checkoutUrl,
      fields,
      orderId,
      orderCode: order.orderCode || orderId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Khong the tao phien thanh toan SePay." },
      { status: 500 }
    );
  }
}
