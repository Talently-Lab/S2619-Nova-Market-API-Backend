import { AppDataSource } from '../config/database.js';
import { OrderEntity } from '../entities/Order.entity.js';
import { OrderItemEntity } from '../entities/OrderItem.entity.js';
import { Product } from '../entities/Product.js';

const orderRepository = () => AppDataSource.getRepository(OrderEntity);
const itemRepository = () => AppDataSource.getRepository(OrderItemEntity);
const productRepository = () => AppDataSource.getRepository(Product);

export const OrderModel = {
  /**
   * Busca un producto por code, activo y no eliminado.
   * Devuelve null si no existe.
   */
  findActiveProductByCode: async (code) => {
    return productRepository()
      .createQueryBuilder('p')
      .where('p.code = :code', { code })
      .andWhere('p.deleted_at IS NULL')
      .andWhere('p.is_active = :active', { active: true })
      .getOne();
  },

  /**
   * Crea una orden con sus ítems y descuenta stock, todo en una transacción.
   * @param {number} userId
   * @param {{ productCode: string, quantity: number, unitPrice: number, productId: number }[]} items
   * @param {number} total
   * @returns {Promise<Order>} orden con ítems
   */
  createWithItems: async (userId, items, total) => {
    return AppDataSource.transaction(async (manager) => {
      // Crear la orden
      const order = manager.create(OrderEntity, {
        user_id: userId,
        status: 'pending',
        total,
      });
      const savedOrder = await manager.save(OrderEntity, order);

      // Crear los ítems
      const orderItems = items.map(({ productId, quantity, unitPrice }) =>
        manager.create(OrderItemEntity, {
          order_id: savedOrder.id,
          product_id: productId,
          quantity,
          unit_price: unitPrice,
        }),
      );
      await manager.save(OrderItemEntity, orderItems);

      // Descontar stock de cada producto (con bloqueo pesimista)
      for (const { productId, quantity } of items) {
        await manager
          .createQueryBuilder()
          .update(Product)
          .set({ stock: () => `stock - ${quantity}` })
          .where('id = :id', { id: productId })
          .execute();
      }

      // Devolver la orden con sus ítems
      return manager
        .getRepository(OrderEntity)
        .createQueryBuilder('o')
        .leftJoinAndSelect('o.items', 'i')
        .where('o.id = :id', { id: savedOrder.id })
        .getOne();
    });
  },

  /**
   * Órdenes de un usuario concreto, con ítems, ordenadas por fecha desc.
   */
  findByUserId: async (userId) => {
    return orderRepository()
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'i')
      .where('o.user_id = :userId', { userId })
      .orderBy('o.created_at', 'DESC')
      .getMany();
  },

  /**
   * Todas las órdenes (admin), con paginación y filtro por estado.
   */
  findAll: async ({ status, page = 1, limit = 20 } = {}) => {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const skip = (safePage - 1) * safeLimit;

    const qb = orderRepository()
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'i')
      .orderBy('o.created_at', 'DESC')
      .skip(skip)
      .take(safeLimit);

    if (status) {
      qb.where('o.status = :status', { status });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page: safePage, limit: safeLimit };
  },

  /** Busca una orden por ID con sus ítems. */
  findById: async (id) => {
    return orderRepository()
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'i')
      .where('o.id = :id', { id })
      .getOne();
  },

  /**
   * Cambia el estado de una orden. Si se cancela, repone el stock en la misma transacción.
   * @param {Order} order  - entidad ya cargada con ítems
   * @param {string} newStatus
   * @returns {Promise<Order>} orden actualizada
   */
  updateStatus: async (order, newStatus) => {
    return AppDataSource.transaction(async (manager) => {
      order.status = newStatus;
      const saved = await manager.save(OrderEntity, order);

      if (newStatus === 'cancelled') {
        const items = await manager
          .getRepository(OrderItemEntity)
          .createQueryBuilder('i')
          .where('i.order_id = :orderId', { orderId: order.id })
          .getMany();

        for (const item of items) {
          await manager
            .createQueryBuilder()
            .update(Product)
            .set({ stock: () => `stock + ${item.quantity}` })
            .where('id = :id', { id: item.product_id })
            .execute();
        }
      }

      return manager
        .getRepository(OrderEntity)
        .createQueryBuilder('o')
        .leftJoinAndSelect('o.items', 'i')
        .where('o.id = :id', { id: saved.id })
        .getOne();
    });
  },
};
