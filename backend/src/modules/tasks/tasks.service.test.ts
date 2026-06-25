import * as tasksService from "./tasks.service";
import { prisma } from "../../lib/prisma";
import { TaskMetaModel } from "../../models/taskMeta.model";

jest.mock("../../lib/prisma", () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  },
}));

jest.mock("../../models/taskMeta.model", () => ({
  TaskMetaModel: {
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(() => ({ lean: () => Promise.resolve(null) })),
    find: jest.fn(() => ({ lean: () => Promise.resolve([]) })),
  },
}));

const prismaMock = prisma as unknown as {
  task: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  user: { findUnique: jest.Mock };
};
const metaMock = TaskMetaModel as unknown as { updateOne: jest.Mock };

describe("tasks.service", () => {
  describe("list", () => {
    it("filtra tarefas criadas por OU atribuídas ao usuário", async () => {
      prismaMock.task.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const result = await tasksService.list(42);

      const whereArg = prismaMock.task.findMany.mock.calls[0][0].where;
      expect(whereArg).toEqual({ OR: [{ creatorId: 42 }, { assigneeId: 42 }] });
      expect(result).toHaveLength(2);
    });
  });

  describe("getById (acesso)", () => {
    it("retorna 404 quando não é criador nem responsável", async () => {
      prismaMock.task.findUnique.mockResolvedValue({
        id: 1,
        creatorId: 99,
        assigneeId: 100,
      });

      await expect(tasksService.getById(1, 1)).rejects.toMatchObject({ status: 404 });
    });

    it("permite acesso ao responsável", async () => {
      prismaMock.task.findUnique
        .mockResolvedValueOnce({ id: 1, creatorId: 99, assigneeId: 1 }) // findAccessible
        .mockResolvedValueOnce({ id: 1, creatorId: 99, assigneeId: 1, creator: {}, assignee: {} });

      const result = await tasksService.getById(1, 1);
      expect(result.id).toBe(1);
    });
  });

  describe("create", () => {
    it("define o responsável como o criador quando não informado", async () => {
      prismaMock.task.create.mockResolvedValue({ id: 5, creatorId: 3, assigneeId: 3 });

      await tasksService.create(3, { title: "Nova" });

      const data = prismaMock.task.create.mock.calls[0][0].data;
      expect(data.creatorId).toBe(3);
      expect(data.assigneeId).toBe(3);
      // não valida existência de outro usuário quando atribui a si mesmo
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
      expect(metaMock.updateOne).toHaveBeenCalled();
    });

    it("valida existência do responsável quando atribui a outro", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null); // usuário não existe

      await expect(
        tasksService.create(3, { title: "Nova", assigneeId: 999 })
      ).rejects.toMatchObject({ status: 400 });
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });
  });
});
