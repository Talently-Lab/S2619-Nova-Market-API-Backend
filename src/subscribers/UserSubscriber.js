import { EventSubscriber } from 'typeorm';
import bcrypt from 'bcryptjs';
import { User } from '../entities/User.js';

export class UserSubscriber {
  listenTo() {
    return User;
  }

  async beforeInsert(event) {
    if (typeof event.entity.password !== 'string' || !event.entity.password) {
      throw new TypeError('La contraseña del usuario debe ser un string no vacío.');
    }

    event.entity.password = await bcrypt.hash(event.entity.password, 12);
  }
}
EventSubscriber()(UserSubscriber);
