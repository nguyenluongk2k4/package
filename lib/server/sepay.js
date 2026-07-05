import { SePayPgClient } from "sepay-pg-node";

const DEFAULT_PAYMENT_METHOD = "BANK_TRANSFER";

function ensureValue(name, value) {
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

export function getSePayConfig() {
  const env = process.env.SEPAY_ENV || "sandbox";
  const merchantId = process.env.SEPAY_MERCHANT_ID || "";
  const secretKey = process.env.SEPAY_SECRET_KEY || "";
  const appUrl = (process.env.SEPAY_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  const paymentMethod = process.env.SEPAY_PAYMENT_METHOD || DEFAULT_PAYMENT_METHOD;
  const ipnSecretKey = process.env.SEPAY_IPN_SECRET_KEY || secretKey;

  return {
    env,
    merchantId,
    secretKey,
    appUrl,
    paymentMethod,
    ipnSecretKey,
  };
}

export function isSePayConfigured() {
  const config = getSePayConfig();
  return Boolean(config.merchantId && config.secretKey && config.appUrl);
}

export function getSePayClient() {
  const config = getSePayConfig();

  return new SePayPgClient({
    env: ensureValue("SEPAY_ENV", config.env),
    merchant_id: ensureValue("SEPAY_MERCHANT_ID", config.merchantId),
    secret_key: ensureValue("SEPAY_SECRET_KEY", config.secretKey),
  });
}

export function buildSePayReturnUrls({ orderId }) {
  const { appUrl } = getSePayConfig();
  const safeAppUrl = ensureValue("SEPAY_APP_URL or NEXT_PUBLIC_APP_URL", appUrl);
  const base = `${safeAppUrl}/cua-toi?order=${encodeURIComponent(orderId)}`;

  return {
    successUrl: `${base}&payment=success`,
    errorUrl: `${base}&payment=error`,
    cancelUrl: `${base}&payment=cancel`,
  };
}

export function buildSePayCheckoutPayload({ order }) {
  const config = getSePayConfig();
  const client = getSePayClient();
  const { successUrl, errorUrl, cancelUrl } = buildSePayReturnUrls({ orderId: order.id });
  const orderInvoiceNumber = order.orderCode || order.id;
  const customData = JSON.stringify({
    orderId: order.id,
    orderCode: order.orderCode || order.id,
    userId: order.userId || "",
  });
  const fields = client.checkout.initOneTimePaymentFields({
    operation: "PURCHASE",
    payment_method: config.paymentMethod || DEFAULT_PAYMENT_METHOD,
    order_invoice_number: orderInvoiceNumber,
    order_amount: Number(order.total || 0),
    currency: "VND",
    order_description: `Thanh toan don hang ${orderInvoiceNumber}`,
    customer_id: order.userId || undefined,
    success_url: successUrl,
    error_url: errorUrl,
    cancel_url: cancelUrl,
    custom_data: customData,
  });

  return {
    checkoutUrl: client.checkout.initCheckoutUrl(),
    fields,
    metadata: {
      orderInvoiceNumber,
      customData,
      successUrl,
      errorUrl,
      cancelUrl,
      paymentMethodCode: config.paymentMethod || DEFAULT_PAYMENT_METHOD,
    },
  };
}

export function parseSePayCustomData(value) {
  if (!value) return null;

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
