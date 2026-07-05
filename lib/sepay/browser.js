async function readError(response) {
  try {
    const payload = await response.json();
    return payload?.error || payload?.message || "Khong the khoi tao thanh toan SePay.";
  } catch {
    return "Khong the khoi tao thanh toan SePay.";
  }
}

export async function requestSePayCheckout({ orderId, user }) {
  if (!orderId) {
    throw new Error("Thieu ma don hang SePay.");
  }

  if (!user) {
    throw new Error("Dang nhap de tiep tuc thanh toan.");
  }

  const token = await user.getIdToken();
  const response = await fetch("/api/sepay/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export function submitSePayForm({ checkoutUrl, fields }) {
  if (typeof document === "undefined") {
    throw new Error("Trinh duyet khong ho tro submit form luc nay.");
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkoutUrl;
  form.style.display = "none";

  Object.entries(fields || {}).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value ?? "");
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
