export class Order {
  constructor({
    id,
    user_id,
    status,
    total,
    created_at,
    updated_at,
  } = {}) {
    this.id = id;
    this.user_id = user_id;
    this.status = status;
    this.total = total;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}
