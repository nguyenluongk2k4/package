import { NextResponse } from "next/server";
import { getAdminDb, FieldValue } from "../../../../lib/server/firebase-admin";
import { getSePayConfig, parseSePayCustomData } from "../../../../lib/server/sepay";

export const runtime = "nodejs";

function toNumericAmount(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toDateValue(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function shouldMoveToPaid(currentStatus) {
  return !currentStatus || currentStatus === "pending" || currentStatus === "failed" || currentStatus === "paid";
}

function shouldMoveToFailed(currentStatus) {
  return !currentStatus || currentStatus === "pending" || currentStatus === "paid" || currentStatus === "failed";
}

async function resolveOrderRef(db, payload) {
  const customData = parseSePayCustomData(payload?.order?.custom_data);
  const orderId = String(customData?.orderId || "").trim();

  if (orderId) {
    const directRef = db.collection("orders").doc(orderId);
    const directSnapshot = await directRef.get();
    if (directSnapshot.exists) {
      return directRef;
    }
  }

  const invoiceNumber = String(payload?.order?.order_invoice_number || "").trim();
  if (!invoiceNumber) return null;

  const snapshot = await db.collection("orders").where("orderCode", "==", invoiceNumber).limit(1).get();
  if (snapshot.empty) return null;
  return snapshot.docs[0].ref;
}

export async function POST(request) {
  try {
    const config = getSePayConfig();
    const incomingSecret = request.headers.get("x-secret-key") || "";

    if (config.ipnSecretKey && incomingSecret !== config.ipnSecretKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const notificationType = String(payload?.notification_type || "").trim();

    if (!notificationType) {
      return NextResponse.json({ error: "Missing notification_type." }, { status: 400 });
    }

    const db = getAdminDb();
    const orderRef = await resolveOrderRef(db, payload);

    if (!orderRef) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    await db.runTransaction(async (transaction) => {
      const orderSnapshot = await transaction.get(orderRef);
      if (!orderSnapshot.exists) {
        throw new Error("Order no longer exists.");
      }

      const order = orderSnapshot.data() || {};
      const currentSePay = order.sepay || {};
      const invoiceNumber = String(payload?.order?.order_invoice_number || order.orderCode || orderRef.id);
      const transactionId = String(payload?.transaction?.transaction_id || payload?.transaction?.id || payload?.id || "");
      const transactionAmount = toNumericAmount(payload?.transaction?.transaction_amount || payload?.order?.order_amount);
      const transactionDate = toDateValue(payload?.transaction?.transaction_date);
      const transactionStatus = String(payload?.transaction?.transaction_status || "").trim();
      const paymentMethodCode = String(payload?.transaction?.payment_method || currentSePay.paymentMethodCode || "");
      const eventId = `sepay-${notificationType.toLowerCase()}-${transactionId || payload?.timestamp || Date.now()}`;

      const nextOrder = {
        updatedAt: FieldValue.serverTimestamp(),
        sepay: {
          ...currentSePay,
          paymentGateway: "sepay",
          orderInvoiceNumber: invoiceNumber,
          transactionId: transactionId || currentSePay.transactionId || "",
          paymentMethodCode: paymentMethodCode || currentSePay.paymentMethodCode || "",
          transactionStatus: transactionStatus || currentSePay.transactionStatus || "",
          paidAmount: transactionAmount || currentSePay.paidAmount || 0,
          paidAt: transactionDate || currentSePay.paidAt || null,
          lastNotificationType: notificationType,
          lastWebhookAt: FieldValue.serverTimestamp(),
        },
      };

      if (notificationType === "ORDER_PAID") {
        nextOrder.paymentStatus = "paid";
        if (shouldMoveToPaid(order.orderStatus)) {
          nextOrder.orderStatus = "paid";
        }
        nextOrder.paidAt = transactionDate || FieldValue.serverTimestamp();
      }

      if (notificationType === "TRANSACTION_VOID") {
        nextOrder.paymentStatus = "failed";
        if (shouldMoveToFailed(order.orderStatus)) {
          nextOrder.orderStatus = "failed";
        }
        nextOrder.failedAt = transactionDate || FieldValue.serverTimestamp();
      }

      transaction.set(orderRef, nextOrder, { merge: true });
      transaction.set(orderRef.collection("events").doc(eventId), {
        type: "sepay_ipn",
        source: "sepay",
        notificationType,
        transactionId,
        from: order.orderStatus || null,
        to: nextOrder.orderStatus || order.orderStatus || null,
        message:
          notificationType === "ORDER_PAID"
            ? "Xác nhận thanh toán thành công"
            : notificationType === "TRANSACTION_VOID"
              ? "Thanh toán không thành công"
              : `Cập nhật thanh toán: ${notificationType}`,
        actorRole: "system",
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to process SePay IPN." },
      { status: 500 }
    );
  }
}
