import { prisma } from "../../lib/prisma";
import { TaskMetaModel } from "../../models/taskMeta.model";
import { HttpError } from "../../middleware/errorHandler";

interface CreateInput {
  title: string;
  description?: string;
  dueDate?: string;
  tags?: string[];
  notes?: string;
}

interface UpdateInput {
  title?: string;
  description?: string;
  dueDate?: string | null;
  tags?: string[];
  notes?: string;
}

async function logActivity(taskId: number, action: string): Promise<void> {
  await TaskMetaModel.updateOne(
    { taskId },
    { $push: { activityLog: { action, at: new Date() } } }
  );
}

export async function list(userId: number) {
  return prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/** Busca a task garantindo que pertence ao usuário. */
async function findOwned(userId: number, id: number) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || task.userId !== userId) {
    throw new HttpError(404, "Tarefa não encontrada");
  }
  return task;
}

export async function getById(userId: number, id: number) {
  const task = await findOwned(userId, id);
  const meta = await TaskMetaModel.findOne({ taskId: id }).lean();
  return { ...task, meta };
}

export async function create(userId: number, input: CreateInput) {
  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      userId,
    },
  });

  await TaskMetaModel.create({
    taskId: task.id,
    tags: input.tags ?? [],
    notes: input.notes,
    activityLog: [{ action: "criada", at: new Date() }],
  });

  return task;
}

export async function update(userId: number, id: number, input: UpdateInput) {
  await findOwned(userId, id);

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      dueDate:
        input.dueDate === undefined
          ? undefined
          : input.dueDate === null
            ? null
            : new Date(input.dueDate),
    },
  });

  if (input.tags !== undefined || input.notes !== undefined) {
    await TaskMetaModel.updateOne(
      { taskId: id },
      {
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      { upsert: true }
    );
  }
  await logActivity(id, "editada");

  return task;
}

export async function toggleComplete(userId: number, id: number) {
  const current = await findOwned(userId, id);
  const task = await prisma.task.update({
    where: { id },
    data: { completed: !current.completed },
  });
  await logActivity(id, task.completed ? "concluída" : "reaberta");
  return task;
}

export async function remove(userId: number, id: number): Promise<void> {
  await findOwned(userId, id);
  await prisma.task.delete({ where: { id } });
  await TaskMetaModel.deleteOne({ taskId: id });
}
