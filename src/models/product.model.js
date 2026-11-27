import { AppDataSource } from '../config/database.js';
import { Product } from '../entities/Product.js';

const productRepository = AppDataSource.getRepository(Product);

export function ProductModelFactory(repo) {
  return {
    /**
     * Listar productos activos y no eliminados con filtros opcionales.
     * Todos los parámetros son opcionales.
     * @param {object} opts
     * @param {string}  [opts.category]   - filtra por category_name (case-insensitive)
     * @param {string}  [opts.search]     - búsqueda parcial en name
     * @param {number}  [opts.minPrice]
     * @param {number}  [opts.maxPrice]
     * @param {string}  [opts.orderBy]    - campo: 'price' | 'name' | 'createdAt' (default)
     * @param {string}  [opts.orderDir]   - 'ASC' | 'DESC' (default ASC)
     * @param {number}  [opts.page]       - 1-based (default 1)
     * @param {number}  [opts.limit]      - items por página (default 20, max 100)
     * @returns {{ data: Product[], total: number, page: number, limit: number }}
     */
    findAll: async ({
      category,
      search,
      minPrice,
      maxPrice,
      orderBy = 'createdAt',
      orderDir = 'ASC',
      page = 1,
      limit = 20,
    } = {}) => {
      const safePage = Math.max(1, Math.floor(page));
      const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
      const skip = (safePage - 1) * safeLimit;

      const ALLOWED_ORDER_FIELDS = { price: 'price', name: 'name', createdAt: 'createdAt' };
      const safeOrderBy = ALLOWED_ORDER_FIELDS[orderBy] ?? 'createdAt';
      const safeOrderDir = orderDir?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      const qb = repo.createQueryBuilder('p')
        .where('p.is_active = :active', { active: true })
        .andWhere('p.deleted_at IS NULL');

      if (category) {
        qb.andWhere('LOWER(p.category_name) = LOWER(:category)', { category });
      }
      if (search) {
        qb.andWhere('p.name ILIKE :search', { search: `%${search}%` });
      }
      if (minPrice !== undefined) {
        qb.andWhere('p.price >= :minPrice', { minPrice });
      }
      if (maxPrice !== undefined) {
        qb.andWhere('p.price <= :maxPrice', { maxPrice });
      }

      qb.orderBy(`p.${safeOrderBy}`, safeOrderDir)
        .skip(skip)
        .take(safeLimit);

      const [data, total] = await qb.getManyAndCount();
      return { data, total, page: safePage, limit: safeLimit };
    },

    /** Busca por code; devuelve null si no existe o está soft-deleted. */
    findByCode: async (code) => {
      return repo.createQueryBuilder('p')
        .where('p.code = :code', { code })
        .andWhere('p.deleted_at IS NULL')
        .getOne();
    },

    /** Lista valores distintos de category_name (no nulos, productos activos y no eliminados). */
    findCategories: async () => {
      const rows = await repo.createQueryBuilder('p')
        .select('DISTINCT p.category_name', 'category_name')
        .where('p.is_active = :active', { active: true })
        .andWhere('p.deleted_at IS NULL')
        .andWhere('p.category_name IS NOT NULL')
        .orderBy('p.category_name', 'ASC')
        .getRawMany();
      return rows.map((r) => r.category_name);
    },

    /** Busca por code sin filtrar eliminados (uso interno). */
    findByCodeIncludingDeleted: async (code) => {
      return repo.findOneBy({ code });
    },

    /** Crea un producto nuevo y lo devuelve. */
    create: async (data) => {
      const entity = repo.create(data);
      return repo.save(entity);
    },

    /** Actualiza los campos indicados. Devuelve el producto actualizado o null si no existe. */
    updateByCode: async (code, data) => {
      const product = await repo.createQueryBuilder('p')
        .where('p.code = :code', { code })
        .andWhere('p.deleted_at IS NULL')
        .getOne();

      if (!product) return null;

      Object.assign(product, data);
      return repo.save(product);
    },

    /** Soft delete: pone deleted_at a ahora. Devuelve el producto o null. */
    softDeleteByCode: async (code) => {
      const product = await repo.createQueryBuilder('p')
        .where('p.code = :code', { code })
        .andWhere('p.deleted_at IS NULL')
        .getOne();

      if (!product) return null;

      await repo.softDelete({ id: product.id });
      return product;
    },
  };
}

export const ProductModel = ProductModelFactory(productRepository);
