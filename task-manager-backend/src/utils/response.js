const success = (res, data, statusCode = 200) => {
  res.status(statusCode).json(data);
};

const error = (res, message, statusCode = 500) => {
  res.status(statusCode).json({ error: message });
};

export { success, error };