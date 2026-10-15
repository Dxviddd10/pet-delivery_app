// ============================================================
// create-checkout · pago en línea (Plan A)
// Crea la orden (payment_method = 'online') y devuelve la URL
// de pago. Soporta dos proveedores según PAYMENT_PROVIDER:
//
//   PAYMENT_PROVIDER=mock   -> pago simulado dentro de la app (para probar)
//   PAYMENT_PROVIDER=wompi  -> Web Checkout real de Wompi
//
// Variables de entorno:
//   PAYMENT_PROVIDER      "mock" (default) | "wompi"
//   ORDER_REDIRECT_URL    (opcional) a dónde vuelve el usuario
//
//   Solo si PAYMENT_PROVIDER=wompi:
//   WOMPI_PUBLIC_KEY, WOMPI_INTEGRITY_SECRET
//
// SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY
// las inyecta Supabase automáticamente.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const provider = (Deno.env.get("PAYMENT_PROVIDER") ?? "mock").toLowerCase();

    const { vet_id, items, delivery_mode, address, notes } = await req.json();

    // Cliente con el JWT del usuario: así auth.uid() funciona dentro de create_order.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: order, error: orderError } = await userClient.rpc("create_order", {
      p_vet_id: vet_id,
      p_items: items,
      p_delivery_mode: delivery_mode,
      p_address: address ?? null,
      p_payment_method: "online",
      p_notes: notes ?? null,
    });
    if (orderError) throw new Error(orderError.message);
    if (!order) throw new Error("No se pudo crear el pedido");

    const reference = String(order.id).replace(/-/g, "");
    const admin = createClient(supabaseUrl, serviceKey);
    await admin
      .from("orders")
      .update({ checkout_session_id: reference, payment_provider: provider })
      .eq("id", order.id);

    // ---------- Proveedor MOCK (simulado, sin pasarela) ----------
    // No devuelve una URL: Supabase fuerza content-type text/plain y una CSP
    // restrictiva en las respuestas de funciones, así que una página HTML no
    // se renderiza. En su lugar la app abre una pantalla nativa de MODO PRUEBA
    // que llama a la RPC mock_pay_order.
    if (provider === "mock") {
      return json({
        order_id: order.id,
        reference,
        provider,
        mode: "in_app",
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        total: order.total,
      });
    }

    // ---------- Proveedor WOMPI (real) ----------
    if (provider === "wompi") {
      const publicKey = Deno.env.get("WOMPI_PUBLIC_KEY");
      const integritySecret = Deno.env.get("WOMPI_INTEGRITY_SECRET");
      const redirectUrl = Deno.env.get("ORDER_REDIRECT_URL") ?? "";
      if (!publicKey || !integritySecret) {
        throw new Error("Faltan WOMPI_PUBLIC_KEY o WOMPI_INTEGRITY_SECRET");
      }

      const amountInCents = order.total * 100;
      const currency = "COP";
      const signature = await sha256Hex(
        `${reference}${amountInCents}${currency}${integritySecret}`,
      );

      const params = new URLSearchParams({
        "public-key": publicKey,
        currency,
        "amount-in-cents": String(amountInCents),
        reference,
        "signature:integrity": signature,
      });
      if (redirectUrl) params.set("redirect-url", redirectUrl);

      const checkoutUrl = `https://checkout.wompi.co/p/?${params.toString()}`;
      return json({
        order_id: order.id,
        reference,
        provider,
        amount_in_cents: amountInCents,
        checkout_url: checkoutUrl,
      });
    }

    throw new Error(`Proveedor de pago no soportado: ${provider}`);
  } catch (e) {
    return json({ error: (e as Error)?.message ?? "Error inesperado" }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
