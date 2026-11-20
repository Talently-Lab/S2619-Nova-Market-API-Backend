import { AppDataSource } from '../config/database.js';
import { UserEntity } from '../entities/User.entity.js';
import { User } from '../entities/User.js';
import validator from 'validator';
import { createHttpError } from '../utils/http-error.js';

const MAX_BCRYPT_PASSWORD_BYTES = 72;

const userRepository = AppDataSource.getRepository(UserEntity);

export function UserModelFactory(userRepository) {
  return {
    create: async (userData) => {
      validate_user_data(userData);
      const user = userRepository.create(userData);
      return userRepository.save(user);
    },
    findByEmail: async (email) => {
      validate_mail(email);
      const normalizedEmail = normalize_email(email);
      return await userRepository.findOneBy({ email: normalizedEmail });
    },
    findById: async (id) => {
      validate_positive_integer_id(id);
      return userRepository.findOneBy({ id });
    },
    getPasswordHash: (user) => {
      validate_user_instance(user);
      return user.password;
    },
    updateLastLogin: async (user) => {
      validate_user_instance(user);
      user.lastLogin = new Date();
      return userRepository.save(user);
    },
  };
}

export const UserModel = UserModelFactory(userRepository);

function validate_user_data(userData) {
  if (!userData || typeof userData !== 'object' || Array.isArray(userData)) {
    throw createHttpError(400, 'Los datos del usuario deben incluir email y contraseña válidos.');
  }

  validate_mail_and_password(userData.email, userData.password);
}

function validate_mail_and_password(email, password) {
  if (invalid_type_or_ausent_mail_password(email, password)) {
    throw createHttpError(400, 'Hay datos faltantes o inválidos. Asegúrese de proporcionar email y contraseña válidos.');
  }

  validate_mail(email);

  if (Buffer.byteLength(password, 'utf8') > MAX_BCRYPT_PASSWORD_BYTES) {
    throw createHttpError(400, 'La contraseña es demasiado larga.');
  }

}

function validate_mail(email) {
  if (  !email || typeof email !== 'string'|| !validator.isEmail(email)) {
    throw createHttpError(400, 'El email proporcionado no es válido.');
  }
}

function invalid_type_or_ausent_mail_password(email, password) {
    return !password  
    || !email
    || typeof email !== 'string'
    || typeof password !== 'string';
}

function normalize_email(email) {
  return email.trim().toLowerCase();
}

function validate_user_instance(user) {
  if (!(user instanceof User)) {
    throw new TypeError('Se esperaba una instancia de User.');
  }
}

function validate_positive_integer_id(id) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new TypeError('El ID debe ser un número entero positivo.');
  }
}
