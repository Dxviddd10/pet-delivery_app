# Edge Functions · Wompi (Plan A)

Funciones que conectan la tienda con **Wompi** para el pago en línea.
Con el Plan A, **todo el dinero entra a TU cuenta de comercio Wompi**; luego
tú liquidas por lotes a cada veterinaria desde el panel (ver `payout_batches`).

| Función | Qué hace |
| --- | --- |
| `create-checkout` | Crea el pedido (`payment_method = 'online'`) y devuelve cómo continuar: la URL del Web Checkout de Wompi, o los datos para el pago simulado (mock). |
| `wompi-webhook` | Recibe el evento `transaction.updated`, valida la firma y marca el pedido como `paid`. |

---

## 0. Modo de prueba (mock) — sin Wompi

Mientras no tengas RUT/cuenta de comercio, puedes probar todo el flujo con el
proveedor **mock**, que es un pago simulado. Actívalo con el secreto
`PAYMENT_PROVIDER=mock` (es el valor por defecto si no defines nada).

Cómo funciona:

1. La app llama a `create-checkout` con `PAYMENT_PROVIDER=mock`.
2. `create-checkout` crea el pedido (`payment_provider = 'mock'`) y devuelve
   los datos del pedido (`mode: 'in_app'`), **sin** URL de pasarela.
3. La app abre la pantalla nativa **`app/mock-pay.tsx`** (MODO PRUEBA) con
   botones *Aprobar pago* / *Rechazar*.
4. Al aprobar, la app llama a la RPC **`mock_pay_order`** (definida en
   `supabase/04_mock_pay_rpc.sql`), que en el servidor marca el pedido como
   `paid` e inserta el pago. **El cliente nunca escribe `payment_status`.**

> ¿Por qué no una página HTML en una Edge Function? Supabase fuerza
> `content-type: text/plain` y una CSP restrictiva en las respuestas de las
> funciones, así que el HTML no se renderiza en el navegador. Por eso el pago
> simulado vive dentro de la app.

Para volver a Wompi más adelante solo cambia `PAYMENT_PROVIDER=wompi` y añade
los secretos de Wompi: **no hay que tocar el código de la app**.

### SQL de este modo

Además de `02_payouts_plan_a.sql` y `03_add_mock_provider.sql`, ejecuta
`supabase/04_mock_pay_rpc.sql` (crea la RPC `mock_pay_order`).

---

## 1. Crear la cuenta Wompi (sandbox)

1. Regístrate en **https://comercios.wompi.co**.
2. En el dashboard, arriba a la derecha, activa el **modo Sandbox / Pruebas**.
3. Ve a **Desarrolladores → Secretos para integración técnica** y copia:
   - **Llave pública** → empieza por `pub_test_`
   - **Secreto de integridad** → empieza por `test_integrity_`
   - **Secreto de eventos** → empieza por `test_events_`

> En producción serán `pub_prod_`, `prod_integrity_` y `prod_events_`.

---

## 2. Desplegar las funciones

No hay CLI de Supabase instalado, así que puedes hacerlo desde el dashboard:

1. Entra a **Supabase → Edge Functions → Deploy a new function**.
2. Crea una función llamada **`create-checkout`** y pega el contenido de
   `supabase/functions/create-checkout/index.ts`.
3. Repite con **`wompi-webhook`** usando
   `supabase/functions/wompi-webhook/index.ts`.
4. Deja **desactivado** "Verify JWT" en `wompi-webhook` (Wompi llama sin JWT).
   En `create-checkout` déjalo **activado** (la llama un usuario autenticado).

### Alternativa con CLI

```bash
supabase functions deploy create-checkout
supabase functions deploy wompi-webhook --no-verify-jwt
```

---

## 3. Configurar secretos

En **Supabase → Project Settings → Edge Functions → Secrets**, añade:

| Secreto | Valor |
| --- | --- |
| `WOMPI_PUBLIC_KEY` | tu llave pública (`pub_test_...`) |
| `WOMPI_INTEGRITY_SECRET` | tu secreto de integridad (`test_integrity_...`) |
| `WOMPI_EVENTS_SECRET` | tu secreto de eventos (`test_events_...`) |
| `ORDER_REDIRECT_URL` | (opcional) a dónde vuelve el usuario tras pagar |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta
Supabase automáticamente; **no** hay que crearlos.

---

## 4. Configurar la URL de eventos (webhook)

En **Wompi → Desarrolladores → URL de eventos**, pon:

```
https://<PROJECT_REF>.supabase.co/functions/v1/wompi-webhook
```

Debes configurar una URL distinta para **Sandbox** y para **Producción**.

---

## 5. Probar el flujo (sandbox)

Tarjetas de prueba:

| Tarjeta | Resultado |
| --- | --- |
| `4242 4242 4242 4242` | `APPROVED` |
| `4111 1111 1111 1111` | `DECLINED` |

Cualquier fecha futura y CVC de 3 dígitos son válidos.

Nequi: `3991111111` aprueba, `3992222222` declina.

Resultado esperado tras un pago aprobado:

1. `orders.payment_status` pasa a `paid` y se llena `paid_at`.
2. Se inserta una fila en `payments` (`provider = 'wompi'`).
3. El pedido ya puede marcarse como `delivered` y luego liquidarse.

---

## Notas y límites

- La `reference` enviada a Wompi es el UUID del pedido **sin guiones** (32 chars) y
  se guarda en `orders.checkout_session_id` para conciliar en el webhook.
- El webhook es **idempotente**: si el pago ya estaba registrado, no lo duplica.
- Si un usuario crea un pedido `online` y **no paga**, el stock queda reservado.
  Más adelante conviene un proceso que cancele pedidos `online` no pagados
  pasados X minutos y devuelva el stock.
- Para **automatizar las transferencias** a veterinarias en el futuro, Wompi tiene
  *Pagos a terceros* (dispersiones por API): sería el paso natural antes de saltar
  al Plan B (split automático).
