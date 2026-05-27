import express from 'express';
import * as usersController from './users.controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = express.Router();

router.post('/register', usersController.register);
router.post('/login', usersController.login);
router.post('/logout', authMiddleware, usersController.logout);

export default router;