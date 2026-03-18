export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3010', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5180',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '8h',
  },
});
