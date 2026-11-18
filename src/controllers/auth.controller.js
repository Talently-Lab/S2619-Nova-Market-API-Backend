import { createHttpError } from '../utils/http-error.js';

export const authController = ({ createUser, userLogin }) => ({
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
});

function validate_request_body(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createHttpError(400, 'El cuerpo de la solicitud debe ser un objeto JSON válido.');
  }
}

