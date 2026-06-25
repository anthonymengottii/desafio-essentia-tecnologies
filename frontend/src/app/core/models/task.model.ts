export interface TaskMeta {
  taskId: number;
  tags: string[];
  notes?: string;
  activityLog: { action: string; at: string }[];
}

import { User } from './user.model';

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  completed: boolean;
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
  dueDate?: string | null;
  assigneeId?: number | null;
  tags?: string[];
  notes?: string;
}
