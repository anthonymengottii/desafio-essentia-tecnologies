import { TaskStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { TaskMetaModel } from "../../models/taskMeta.model";
import { HttpError } from "../../middleware/errorHandler";

const STATUS_LABEL: Record<TaskStatus, string> = {
  PENDENTE: "pendente",
  EM_ANDAMENTO: "em andamento",
  CONCLUIDA: "concluída",
};

interface CreateInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string;
  assigneeId?: number | null;
  tags?: string[];
  notes?: string;
}

interface UpdateInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string | null;
  assigneeId?: number | null;
  tags?: string[];
  notes?: string;
}

// Inclui dados públicos de quem criou e de quem é responsável.
const userSelect = { select: { id: true, name: true, email: true } };
const taskInclude = { creator: userSelect, assignee: userSelect };

async function logActivity(taskId: number, action: string): Promise<void> {
  await TaskMetaModel.updateOne(
    { taskId },
    { $push: { activityLog: { action, at: new Date() } } }
  );
}

/** Garante que o usuário informado existe (para atribuição). */
async function assertUserExists(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(400, "Usuário responsável não encontrado");
  }
}

export async function list(userId: number) {
  // Tarefas que o usuário criou OU que foram atribuídas a ele.
  return prisma.task.findMany({
    where: { OR: [{ creatorId: userId }, { assigneeId: userId }] },
    include: taskInclude,
    orderBy: { createdAt: "desc" },
  });
}

/** Busca a task garantindo que o usuário é criador ou responsável. */
async function findAccessible(userId: number, id: number) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || (task.creatorId !== userId && task.assigneeId !== userId)) {
    throw new HttpError(404, "Tarefa não encontrada");
  }
  return task;
}

export async function getById(userId: number, id: number) {
  await findAccessible(userId, id);
  const task = await prisma.task.findUnique({ where: { id }, include: taskInclude });
  const meta = await TaskMetaModel.findOne({ taskId: id }).lean();
  return { ...task, meta };
}

export async function create(userId: number, input: CreateInput) {
  const assigneeId = input.assigneeId ?? userId;
  if (assigneeId !== userId) {
    await assertUserExists(assigneeId);
  }

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      status: input.status ?? "PENDENTE",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      creatorId: userId,
      assigneeId,
    },
    include: taskInclude,
  });

  // upsert evita colisão caso exista metadado órfão (ex.: após reset do MySQL).
  await TaskMetaModel.updateOne(
    { taskId: task.id },
    {
      $set: {
        tags: input.tags ?? [],
        notes: input.notes,
        activityLog: [{ action: "criada", at: new Date() }],
      },
    },
    { upsert: true }
  );

  return task;
}

export async function update(userId: number, id: number, input: UpdateInput) {
  await findAccessible(userId, id);

  if (input.assigneeId != null) {
    await assertUserExists(input.assigneeId);
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      assigneeId: input.assigneeId === undefined ? undefined : input.assigneeId,
      dueDate:
        input.dueDate === undefined
          ? undefined
          : input.dueDate === null
            ? null
            : new Date(input.dueDate),
    },
    include: taskInclude,
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

export async function setStatus(userId: number, id: number, status: TaskStatus) {
  await findAccessible(userId, id);
  const task = await prisma.task.update({
    where: { id },
    data: { status },
    include: taskInclude,
  });
  await logActivity(id, `status: ${STATUS_LABEL[status]}`);
  return task;
}

export async function remove(userId: number, id: number): Promise<void> {
  await findAccessible(userId, id);
  await prisma.task.delete({ where: { id } });
  await TaskMetaModel.deleteOne({ taskId: id });
}
