import request from "supertest";
import { createApp } from "./app";

// Evita instanciar PrismaClient/conexões reais ao importar as rotas.
jest.mock("./lib/prisma", () => ({ prisma: {} }));
jest.mock("./models/taskMeta.model", () => ({ TaskMetaModel: {} }));

const app = createApp();

describe("API (rotas protegidas)", () => {
  it("GET /api/health responde 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /api/tasks sem token → 401", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });

  it("GET /api/tasks com token inválido → 401", async () => {
    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", "Bearer token-invalido");
    expect(res.status).toBe(401);
  });
});
