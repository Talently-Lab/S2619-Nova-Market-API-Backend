import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} from '../services/order.service.js';

// POST /api/orders  (usuario autenticado)
export async function postOrder(req, res, next) {
  try {
    const userId = Number(req.user.sub);
    const order = await createOrder(userId, req.body);
    return res.status(201).json({
      status_code: 201,
      status_description: 'Pedido creado correctamente.',
      order,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/orders/my  (usuario autenticado)
export async function getMyOrdersHandler(req, res, next) {
  try {
    const userId = Number(req.user.sub);
    const orders = await getMyOrders(userId);
    return res.status(200).json({
      status_code: 200,
      status_description: 'Pedidos obtenidos correctamente.',
      orders,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/orders  (solo Admin)
export async function getOrdersHandler(req, res, next) {
  try {
    const result = await getAllOrders(req.query);
    return res.status(200).json({
      status_code: 200,
      status_description: 'Pedidos obtenidos correctamente.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/orders/:id/status  (solo Admin)
export async function patchOrderStatus(req, res, next) {
  try {
    const order = await updateOrderStatus(req.params.id, req.body);
    return res.status(200).json({
      status_code: 200,
      status_description: 'Estado del pedido actualizado correctamente.',
      order,
    });
  } catch (error) {
    next(error);
  }
}
