import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import taskRoutes from './domains/task/task.routes.js';
import usersRoutes from './domains/users/users.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, './docs/swagger.json'), 'utf8'));

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/tasks', taskRoutes);
app.use('/api/users', usersRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/api-docs-json', (req, res) => {
  res.json(swaggerDocument);
});

app.get('/', (req, res) => {
  res.send('Root works');
});

export default app;