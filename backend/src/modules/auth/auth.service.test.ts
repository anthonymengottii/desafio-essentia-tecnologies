import bcrypt from "bcryptjs";
import * as authService from "./auth.service";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errorHandler";

jest.mock("../../lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "fake-token"),
}));

const prismaMock = prisma as unknown as {
  user: { findUnique: jest.Mock; create: jest.Mock };
};

describe("auth.service", () => {
  describe("register", () => {
    it("cria usuário com senha hasheada e retorna token", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockImplementation(async ({ data }: any) => ({
        id: 1,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
      }));

      const result = await authService.register("Ana", "ana@x.com", "123456");

      expect(result.token).toBe("fake-token");
      expect(result.user).toEqual({ id: 1, name: "Ana", email: "ana@x.com" });
      // senha não deve ser armazenada em texto puro
      const createdHash = prismaMock.user.create.mock.calls[0][0].data.passwordHash;
      expect(createdHash).not.toBe("123456");
      expect(await bcrypt.compare("123456", createdHash)).toBe(true);
    });

    it("rejeita e-mail já cadastrado (409)", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, email: "ana@x.com" });

      await expect(authService.register("Ana", "ana@x.com", "123456")).rejects.toMatchObject({
        status: 409,
      });
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("retorna token com credenciais válidas", async () => {
      const passwordHash = await bcrypt.hash("123456", 10);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 7,
        name: "Bob",
        email: "bob@x.com",
        passwordHash,
      });

      const result = await authService.login("bob@x.com", "123456");
      expect(result.token).toBe("fake-token");
      expect(result.user.id).toBe(7);
    });

    it("rejeita senha incorreta (401)", async () => {
      const passwordHash = await bcrypt.hash("correta", 10);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 7,
        name: "Bob",
        email: "bob@x.com",
        passwordHash,
      });

      await expect(authService.login("bob@x.com", "errada")).rejects.toBeInstanceOf(HttpError);
    });

    it("rejeita usuário inexistente (401)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(authService.login("nao@existe.com", "x")).rejects.toMatchObject({
        status: 401,
      });
    });
  });
});
