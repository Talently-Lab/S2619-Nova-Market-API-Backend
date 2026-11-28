import { OrderModel } from '../models/order.model.js';
import { ORDER_STATUSES } from '../entities/Order.entity.js';
import { createHttpError } from '../utils/http-error.js';

// ─── Tabla de transiciones permitidas ────────────────────────────────────────
// Solo se puede avanzar al estado destino si el estado actual está en la lista.
const ALLOWED_TRANSITIONS = {
  pending:   ['paid', 'cancelled'],
  paid:      ['shipped', 'cancelled'],
  shipped:   ['delivered'],
  delivered: [],           // terminal
  cancelled: [],           // terminal
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildOrderResponse(order) {
  return {
    id: order.id,
    user_id: order.user_id,
    status: order.status,
    total: Number(order.total),
    created_at: order.created_at,
    updated_at: order.updated_at,
    items: (order.items ?? []).map((item) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      subtotal: Number(item.unit_price) * item.quantity,
    })),
  };
}

function validateItemsInput(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw createHttpError(400, 'Se requiere al menos un ítem en el pedido.');
  }

  for (const [i, item] of items.entries()) {
    if (!item || typeof item !== 'object') {
      throw createHttpError(400, `El ítem en la posición ${i} no es un objeto válido.`);
    }
    if (typeof item.code !== 'string' || !item.code.trim()) {
      throw createHttpError(400, `El ítem en la posición ${i} debe tener un campo "code" (string).`);
    }
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      throw createHttpError(400, `El ítem con code "${item.code}" debe tener "quantity" entero >= 1.`);
    }
  }
}

// ─── Servicios ────────────────────────────────────────────────────────────────

/**
 * POST /api/orders
 * El cliente envía:  { items: [{ code: "PROD-001", quantity: 2 }, ...] }
 * El servidor calcula precios y total desde la BD.
 */
export async function createOrder(userId, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createHttpError(400, 'El cuerpo de la solicitud debe ser un objeto JSON válido.');
  }

  validateItemsInput(body.items);

  // Deduplicar por code (suma cantidades si el mismo producto viene repetido)
  const deduped = new Map();
  for (const item of body.items) {
    const code = item.code.trim();
    deduped.set(code, (deduped.get(code) ?? 0) + Number(item.quantity));
  }

  // Validar existencia, estado y stock de cada producto
  const resolvedItems = [];
  for (const [code, quantity] of deduped.entries()) {
    const product = await OrderModel.findActiveProductByCode(code);
    if (!product) {
      throw createHttpError(404, `El producto con código "${code}" no existe o no está disponible.`);
    }
    if (product.stock < quantity) {
      throw createHttpError(422, `Stock insuficiente para el producto "${code}". Disponible: ${product.stock}, solicitado: ${quantity}.`);
    }
    resolvedItems.push({
      productId: product.id,
      productCode: code,
      quantity,
      unitPrice: Number(product.price),
    });
  }

  // Calcular total en el servidor
  const total = resolvedItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const order = await OrderModel.createWithItems(userId, resolvedItems, total);
  return buildOrderResponse(order);
}

/**
 * GET /api/orders/my
 * Devuelve las órdenes del usuario autenticado con sus ítems.
 */
export async function getMyOrders(userId) {
  const orders = await OrderModel.findByUserId(userId);
  return orders.map(buildOrderResponse);
}

/**
 * GET /api/orders  (Admin)
 * Paginación y filtro por estado.
 */
export async function getAllOrders(query) {
  const { status, page, limit } = query ?? {};

  if (status !== undefined && !ORDER_STATUSES.includes(status)) {
    throw createHttpError(400, `Estado inválido. Valores permitidos: ${ORDER_STATUSES.join(', ')}.`);
  }

  const pageNum = page !== undefined ? Number(page) : 1;
  const limitNum = limit !== undefined ? Number(limit) : 20;

  if (!Number.isInteger(pageNum) || pageNum < 1) {
    throw createHttpError(400, 'El parámetro "page" debe ser un entero >= 1.');
  }
  if (!Number.isInteger(limitNum) || limitNum < 1) {
    throw createHttpError(400, 'El parámetro "limit" debe ser un entero >= 1.');
  }

  const result = await OrderModel.findAll({ status, page: pageNum, limit: limitNum });
  return {
    data: result.data.map(buildOrderResponse),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: Math.ceil(result.total / result.limit),
  };
}

/**
 * PATCH /api/orders/:id/status  (Admin)
 * Valida transición y, si cancela, repone stock en la misma transacción.
 */
export async function updateOrderStatus(orderId, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createHttpError(400, 'El cuerpo de la solicitud debe ser un objeto JSON válido.');
  }

  const { status: newStatus } = body;

  if (typeof newStatus !== 'string' || !newStatus.trim()) {
    throw createHttpError(400, 'El campo "status" es obligatorio.');
  }

  if (!ORDER_STATUSES.includes(newStatus)) {
    throw createHttpError(400, `Estado inválido. Valores permitidos: ${ORDER_STATUSES.join(', ')}.`);
  }

  const id = Number(orderId);
  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError(400, 'El ID de la orden debe ser un entero positivo.');
  }

  const order = await OrderModel.findById(id);
  if (!order) {
    throw createHttpError(404, `No se encontró la orden con ID ${id}.`);
  }

  if (order.status === newStatus) {
    throw createHttpError(422, `La orden ya se encuentra en estado "${newStatus}".`);
  }

  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw createHttpError(
      422,
      `No se puede pasar de "${order.status}" a "${newStatus}". Transiciones válidas desde "${order.status}": ${allowed.length ? allowed.join(', ') : 'ninguna (estado terminal)'}.`,
    );
  }

  const updated = await OrderModel.updateStatus(order, newStatus);
  return buildOrderResponse(updated);
}
