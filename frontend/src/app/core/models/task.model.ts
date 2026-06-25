export interface ChecklistItem {
  text: string;
  done: boolean;
}

export interface TaskMeta {
  taskId: number;
  tags: string[];
  notes?: string;
  checklist?: ChecklistItem[];
  activityLog: { action: string; at: string }[];
}

import { User } from './user.model';

export type TaskStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA';

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  creatorId: number;
  creator?: User;
  assigneeId?: number | null;
  assignee?: User | null;
  createdAt: string;
  updatedAt: string;
  meta?: TaskMeta | null;
}

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string | null;
  assigneeId?: number | null;
  tags?: string[];
  notes?: string;
  checklist?: ChecklistItem[];
}

/** Rótulos legíveis para cada status. */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
};

export const STATUS_OPTIONS: TaskStatus[] = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA'];
