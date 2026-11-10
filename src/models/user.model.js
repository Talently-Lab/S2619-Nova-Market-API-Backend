import { AppDataSource } from '../config/database.js';
import { UserEntity } from '../entities/User.entity.js';
import validator from 'validator';
import { createHttpError } from '../utils/http-error.js';

const MAX_BCRYPT_PASSWORD_BYTES = 72;

const userRepository = AppDataSource.getRepository(UserEntity);

export function UserModelFactory(userRepository) {
  return {
    create: async (userData) => {
      validate_mail_and_password(userData.email, userData.password);
      const user = userRepository.create(userData);
      return userRepository.save(user);
    },
    findByEmail: async (email) => { 
      validate_mail(email);
      const normalizedEmail = normalize_email(email);     
      return await userRepository.findOneBy({ email: normalizedEmail });
    }
  };
}

export const UserModel = {
    create: async (userData) => {
        validate_mail_and_password(userData.email, userData.password);
        const user = userRepository.create(userData);
        return await userRepository.save(user);
    },

    findByEmail: async (email) => {
        validate_mail(email);
        const normalizedEmail = normalize_email(email);
        return await userRepository.findOneBy({ email: normalizedEmail });
    }
};

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





