export interface TaskMeta {
  taskId: number;
  tags: string[];
  notes?: string;
  activityLog: { action: string; at: string }[];
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  completed: boolean;
  dueDate?: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  meta?: TaskMeta | null;
}

export interface TaskInput {
  title: string;
  description?: string;
  dueDate?: string | null;
  tags?: string[];
  notes?: string;
}
