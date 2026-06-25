// Variáveis mínimas para o config/env não falhar durante os testes.
process.env.DATABASE_URL = "mysql://root:root@localhost:3306/test";
process.env.MONGO_URL = "mongodb://localhost:27017/test";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.PORT = "3333";
process.env.CORS_ORIGIN = "http://localhost:4200";
