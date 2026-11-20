import { createHttpError } from '../utils/http-error.js';

export const authController = ({ createUser, userLogin, protectedProfile }) => ({
  registerUser: async (req, res, next) => {
    try {

        validate_request_body(req.body);
        const user = await createUser(req.body);

        return res.status(201).json({
          jwt_token: user.token,
          user: user.data,
          status_code: 201,
          status_description: 'Usuario registrado exitosamente.'
        });
    } catch (error) {
      next(error);
    }
  },
  loginUser: async (req, res, next) => {
    try {
      validate_request_body(req.body);
      const jwtToken = await userLogin(req.body);

      return res.status(201).json({
        status_code: 201,
        status_description: 'El usuario pudo loguearse correctamente',
        jwt_token: jwtToken,
      });
    } catch (error) {
      next(error);
    }
  },
  protectedProfile: async (req, res, next) => {
    try {
      const authorizationHeader = getAuthorizationHeader(req);
      validate_authorization_header(authorizationHeader);
      const user = await protectedProfile(authorizationHeader);

      return res.status(201).json({
        status_code: 201,
        status_description: 'se obtuvieron los datos del usuario correctamente',
        user,
      });
    } catch (error) {
      next(error);
    }
  },
});

// Lee Authorization desde Express o desde headers en los tests unitarios.
function getAuthorizationHeader(req) {
  if (typeof req.get === 'function') {
    return req.get('authorization');
  }

  return req.headers?.authorization;
}

// Rechaza headers ausentes antes de que el servicio extraiga el token Bearer.
function validate_authorization_header(authorizationHeader) {
  if (typeof authorizationHeader !== 'string' || !authorizationHeader.trim()) {
    throw createHttpError(401, 'Falta el header Authorization.');
  }
}

function validate_request_body(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createHttpError(400, 'El cuerpo de la solicitud debe ser un objeto JSON válido.');
  }
}
