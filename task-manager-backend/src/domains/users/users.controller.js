import * as usersService from './users.service.js';
import { success, error } from '../../utils/response.js';

const register = async (req, res) => {
  const { name, lastname, email, password } = req.body;

  if (!name || !lastname || !email || !password) {
    return error(res, 'All fields are required', 400);
  }

  const result = await usersService.register({ name, lastname, email, password });

  if (result.error) {
    return error(res, result.error, result.status);
  }

  success(res, result.data, result.status);
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return error(res, 'Email and password are required', 400);
  }

  const result = await usersService.login({ email, password });

  if (result.error) {
    return error(res, result.error, result.status);
  }

  success(res, result.data, result.status);
};

const logout = async (req, res) => {
  const userId = req.user.id;
  const result = await usersService.logout(userId);
  success(res, result.data);
};

export {
  register,
  login,
  logout
};