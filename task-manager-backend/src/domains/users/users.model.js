import prisma from '../../utils/prisma.js';

const findByEmail = async (email) => {
  return await prisma.user.findUnique({ where: { email } });
};

const findById = async (id) => {
  return await prisma.user.findUnique({ where: { id } });
};

const findByToken = async (token) => {
  return await prisma.user.findFirst({ where: { token } });
};

const create = async (data) => {
  return await prisma.user.create({ data });
};

const updateToken = async (id, token) => {
  return await prisma.user.update({
    where: { id },
    data: { token }
  });
};

const clearToken = async (id) => {
  return await prisma.user.update({
    where: { id },
    data: { token: null }
  });
};

export {
  findByEmail,
  findById,
  findByToken,
  create,
  updateToken,
  clearToken
};