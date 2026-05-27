import { validateToken } from '../domains/users/users.service.js';
import { error } from '../utils/response.js';

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return error(res, 'Token required', 401);
  }
  const token = authHeader.split(' ')[1];
  const result = await validateToken(token);
  if (result.error) {
    return error(res, result.error, result.status);
  }
  req.user = result.data;
  next();
};
