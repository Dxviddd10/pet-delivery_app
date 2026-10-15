-- ============================================================
-- Permite el proveedor de pago "mock" (simulado) en orders.
-- Necesario para probar el flujo de pago online sin pasarela.
-- Ejecutar después de 02_payouts_plan_a.sql.
-- ============================================================

alter table orders drop constraint if exists orders_payment_provider_check;

alter table orders
  add constraint orders_payment_provider_check
  check (payment_provider in ('mercadopago', 'wompi', 'stripe', 'mock'));
