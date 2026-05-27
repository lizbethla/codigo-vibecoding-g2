import express from 'express';
const app = express();

app.get('/hello', (req, res) => {
  res.send('Hello');
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server on port ${PORT}`);
});