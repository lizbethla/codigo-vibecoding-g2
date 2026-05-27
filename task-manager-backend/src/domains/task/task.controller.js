import * as taskService from './task.service.js';
import { success, error } from '../../utils/response.js';

const getAllTasks = async (req, res) => {
  const tasks = await taskService.getAll(req.user.id);
  success(res, tasks);
};

const getTaskById = async (req, res) => {
  const { id } = req.params;
  const task = await taskService.getById(id);
  if (!task) {
    return error(res, 'Task not found', 404);
  }
  success(res, task);
};

const createTask = async (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return error(res, 'Title is required', 400);
  }
  const newTask = await taskService.create({ title, description }, req.user.id);
  success(res, newTask, 201);
};

const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, completed } = req.body;
  const updated = await taskService.update(id, { title, description, completed });
  if (!updated) {
    return error(res, 'Task not found', 404);
  }
  success(res, updated);
};

const deleteTask = async (req, res) => {
  const { id } = req.params;
  const removed = await taskService.remove(id);
  if (!removed) {
    return error(res, 'Task not found', 404);
  }
  res.status(204).send();
};

export {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};