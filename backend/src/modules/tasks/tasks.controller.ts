import { Request, Response } from "express";
import { z } from "zod";
import * as tasksService from "./tasks.service";
import { HttpError } from "../../middleware/errorHandler";

const createSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "ID inválido");
  }
  return id;
}

export async function list(req: Request, res: Response): Promise<void> {
  const tasks = await tasksService.list(req.userId!);
  res.json(tasks);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const task = await tasksService.getById(req.userId!, parseId(req.params.id));
  res.json(task);
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createSchema.parse(req.body);
  const task = await tasksService.create(req.userId!, input);
  res.status(201).json(task);
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = updateSchema.parse(req.body);
  const task = await tasksService.update(req.userId!, parseId(req.params.id), input);
  res.json(task);
}

export async function toggleComplete(req: Request, res: Response): Promise<void> {
  const task = await tasksService.toggleComplete(req.userId!, parseId(req.params.id));
  res.json(task);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await tasksService.remove(req.userId!, parseId(req.params.id));
  res.status(204).send();
}
