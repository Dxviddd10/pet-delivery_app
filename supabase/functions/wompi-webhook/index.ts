// ============================================================
// wompi-webhook · Wompi (Plan A)
// Recibe el evento transaction.updated, verifica la firma y,
// si la transacción fue APPROVED, marca el pedido como pagado.
//
// Variables de entorno:
//   WOMPI_EVENTS_SECRET  (test_events_... / prod_events_...)
//
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY las inyecta Supabase.
//
// URL de eventos a configurar en el dashboard de Wompi:
//   https://<PROJECT_REF>.supabase.co/functions/v1/wompi-webhook
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Lee una propiedad por ruta con puntos: "transaction.id" -> data.transaction.id
function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<any>((acc, key) => (acc == null ? acc : acc[key]), obj);
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const eventsSecret = Deno.env.get("WOMPI_EVENTS_SECRET")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const raw = await req.text();
    const event = JSON.parse(raw);

    // ---------- 1. Verificar firma del evento ----------
    const properties: string[] = event?.signature?.properties ?? [];
    const timestamp = event?.timestamp;
    const expected = event?.signature?.checksum;

    const concatenated =
      properties.map((p) => String(getByPath(event.data, p) ?? "")).join("") +
      String(timestamp) +
      eventsSecret;

    const calculated = (await sha256Hex(concatenated)).toUpperCase();

    if (!expected || calculated !== String(expected).toUpperCase()) {
      // Firma inválida: ignorar. Respondemos 200 para no generar reintentos.
      return new Response(
        JSON.stringify({ ignored: true, reason: "invalid signature" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // ---------- 2. Solo nos interesan transacciones aprobadas ----------
    const tx = event?.data?.transaction;
    if (event?.event !== "transaction.updated" || !tx) {
      return new Response(JSON.stringify({ ignored: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (tx.status !== "APPROVED") {
      return new Response(
        JSON.stringify({ received: true, status: tx.status }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // ---------- 3. Idempotencia: ¿ya registramos este pago? ----------
    const { data: existing } = await admin
      .from("payments")
      .select("id")
      .eq("provider_ref", tx.id)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ already_processed: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ---------- 4. Buscar el pedido por la referencia ----------
    const reference = String(tx.reference ?? "");
    const { data: order } = await admin
      .from("orders")
      .select("id, total, payment_status")
      .eq("checkout_session_id", reference)
      .maybeSingle();

    if (!order) {
      return new Response(
        JSON.stringify({ ignored: true, reason: "order not found", reference }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // ---------- 5. Marcar el pedido como pagado ----------
    if (order.payment_status !== "paid") {
      await admin
        .from("orders")
        .update({ payment_status: "paid", paid_at: new Date().toISOString() })
        .eq("id", order.id);
    }

    // ---------- 6. Registrar el pago ----------
    await admin.from("payments").insert({
      payable_type: "order",
      payable_id: order.id,
      provider: "wompi",
      provider_ref: tx.id,
      amount: order.total,
      status: "paid",
      currency: tx.currency ?? "COP",
      raw_payload: event,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    // Error real: responder 500 para que Wompi reintente.
    return new Response(
      JSON.stringify({ error: (e as Error)?.message ?? "Error inesperado" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
