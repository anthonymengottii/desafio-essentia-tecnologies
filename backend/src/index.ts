import { createApp } from "./app";
import { connectMongo } from "./lib/mongo";
import { prisma } from "./lib/prisma";
import { env } from "./config/env";

async function main() {
  await prisma.$connect();
  console.log("MySQL (Prisma) conectado");

  await connectMongo();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`API rodando em http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("Falha ao iniciar o servidor:", err);
  process.exit(1);
});
