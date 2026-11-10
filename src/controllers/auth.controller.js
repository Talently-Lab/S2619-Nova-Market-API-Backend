import { createHttpError } from '../utils/http-error.js';

export const authController = ({ createUser }) => ({
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
});

function validate_request_body(body) {
  if (!body || typeof body !== 'object') {
    throw createHttpError(400, 'El cuerpo de la solicitud debe ser un objeto JSON válido.');
  }
}



