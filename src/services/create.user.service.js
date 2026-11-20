import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model.js';
import { createHttpError } from '../utils/http-error.js';

const USER_ROLE_ID = 1;

export const createUser = async (userData) => {

    validate_input_data(userData);
    validate_configured_jwt_secret();
    const user = await createNewUser(
      userData.name,
      userData.last_name,
      userData.email,
      userData.password,
    );
    const token = generate_jwt_token(user, process.env.JWT_SECRET);
    const { password, ...userWithoutPassword } = user;
    return {token: token, data: userWithoutPassword};
};


function validate_input_data(userData) {
    if (
      !userData
      || typeof userData !== 'object'
      || Array.isArray(userData)
      || invalid_type_or_ausent_data(
        userData.name,
        userData.last_name,
        userData.email,
        userData.password,
      )
    ) {
        throw createHttpError(400, 'El cuerpo de la solicitud debe contener name, last_name, email y password de tipos válidos.');
    }

    if (invalid_password(userData.password)) {
    throw createHttpError(400, 'La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y un carácter especial.');
    }
  }

function invalid_password(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return !(hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar);  
}



async function createNewUser(name, lastName, email, password) {


    const existingUser = await UserModel.findByEmail(email);

    if (existingUser) {
        throw createHttpError(409, 'El email ya está registrado');
    }
  
    return await UserModel.create({
        name: name.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        roleId: USER_ROLE_ID,
    });
}

function generate_jwt_token(user, jwtSecret) {
    const token = jwt.sign(
    { roleId: user.roleId, 
      email: user.email,
      name: user.name,
      lastName: user.lastName
    },
    jwtSecret,
    { subject: String(user.id), expiresIn: '1h' },
  );
  return token;
}


function validate_configured_jwt_secret() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw createHttpError(500, 'JWT_SECRET no está configurado.');
  }
}



function invalid_type_or_ausent_data(name, lastName, email, password) {
    return !is_non_empty_string(name)
    || !is_non_empty_string(lastName)
    || !is_non_empty_string(email)
    || !is_non_empty_string(password);
}

function is_non_empty_string(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
