import { v4 as uuidv4 } from 'uuid';

const tasks = [];

const taskSchema = {
  id: null,
  title: null,
  description: null,
  completed: false,
  createdAt: null,
  updatedAt: null
};

const createTask = (data) => {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    title: data.title,
    description: data.description || '',
    completed: data.completed || false,
    createdAt: now,
    updatedAt: now
  };
};

export { tasks, taskSchema, createTask };