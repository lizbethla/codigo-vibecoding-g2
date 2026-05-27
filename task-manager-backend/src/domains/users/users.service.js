import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as usersModel from './users.model.js';

const register = async (data) => {
  const { name, lastname, email, password } = data;

  const existingUser = await usersModel.findByEmail(email);
  if (existingUser) {
    return { error: 'Email already registered', status: 409 };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await usersModel.create({
    name,
    lastname,
    email,
    password: hashedPassword
  });

  const { password: _, ...userWithoutPassword } = user;
  return { data: userWithoutPassword, status: 201 };
};

const login = async (data) => {
  const { email, password } = data;

  const user = await usersModel.findByEmail(email);
  if (!user) {
    return { error: 'Invalid credentials', status: 401 };
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return { error: 'Invalid credentials', status: 401 };
  }

  const token = uuidv4();
  await usersModel.updateToken(user.id, token);

  const { password: _, ...userWithoutPassword } = user;
  return { data: { user: userWithoutPassword, token }, status: 200 };
};

const validateToken = async (token) => {
  if (!token) {
    return { error: 'Token required', status: 401 };
  }

  const user = await usersModel.findByToken(token);
  if (!user) {
    return { error: 'Invalid token', status: 401 };
  }

  const { password: _, ...userWithoutPassword } = user;
  return { data: userWithoutPassword };
};

const logout = async (userId) => {
  await usersModel.clearToken(userId);
  return { data: { message: 'Logged out successfully' } };
};

export {
  register,
  login,
  validateToken,
  logout
};