import prisma from '../../utils/prisma.js';

const getAll = async (userId) => {
  return await prisma.task.findMany({ where: { userId } });
};

const getById = async (id) => {
  return await prisma.task.findUnique({ where: { id } });
};

const create = async (data, userId) => {
  return await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || '',
      completed: data.completed || false,
      userId
    }
  });
};

const update = async (id, data) => {
  try {
    return await prisma.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.completed !== undefined && { completed: data.completed })
      }
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return null;
    }
    throw error;
  }
};

const remove = async (id) => {
  try {
    await prisma.task.delete({ where: { id } });
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      return false;
    }
    throw error;
  }
};

export { getAll, getById, create, update, remove };