import express from 'express';
import http from 'http';

const app = express();

const server = http.createServer(app);

app.get('/test', (req, res) => {
  res.send('Test works');
});

server.listen(3002, () => {
  console.log('Server on 3002');
});