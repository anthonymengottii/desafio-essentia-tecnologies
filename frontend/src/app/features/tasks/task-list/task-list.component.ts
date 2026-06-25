import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/task.service';
import { UserService } from '../../../core/user.service';
import { AuthService } from '../../../core/auth/auth.service';
import {
  STATUS_LABELS,
  STATUS_OPTIONS,
  Task,
  TaskStatus,
} from '../../../core/models/task.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-task-list',
  imports: [FormsModule, DatePipe],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  private userService = inject(UserService);
  private auth = inject(AuthService);

  readonly currentUserId = this.auth.user()?.id ?? null;

  readonly statusLabels = STATUS_LABELS;
  readonly statusOptions = STATUS_OPTIONS;

  tasks = signal<Task[]>([]);
  users = signal<User[]>([]);
  pendingCount = computed(
    () => this.tasks().filter((t) => t.status !== 'CONCLUIDA').length
  );
  loading = signal(false);
  error = signal('');

  // Estado do modal de formulário (criação/edição)
  modalOpen = signal(false);
  editingId = signal<number | null>(null);
  title = '';
  description = '';
  tags = '';
  assigneeId: number | null = null;
  status: TaskStatus = 'PENDENTE';

  // Estado do modal de exclusão
  taskToDelete = signal<Task | null>(null);

  ngOnInit(): void {
    this.load();
    this.userService.list().subscribe({
      next: (users) => this.users.set(users),
    });
  }

  load(): void {
    this.loading.set(true);
    this.taskService.list().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar tarefas');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (!this.title.trim()) {
      return;
    }
    const input = {
      title: this.title.trim(),
      description: this.description.trim() || undefined,
      status: this.status,
      assigneeId: this.assigneeId,
      tags: this.tags
        ? this.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined,
    };

    const id = this.editingId();
    const req = id
      ? this.taskService.update(id, input)
      : this.taskService.create(input);

    req.subscribe({
      next: () => {
        this.closeModal();
        this.load();
      },
      error: (err) => this.error.set(err?.error?.error ?? 'Erro ao salvar tarefa'),
    });
  }

  openCreate(): void {
    this.resetForm();
    this.modalOpen.set(true);
  }

  startEdit(task: Task): void {
    this.editingId.set(task.id);
    this.title = task.title;
    this.description = task.description ?? '';
    this.tags = task.meta?.tags?.join(', ') ?? '';
    this.assigneeId = task.assigneeId ?? null;
    this.status = task.status;
    this.error.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.resetForm();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modalOpen()) {
      this.closeModal();
    }
    if (this.taskToDelete()) {
      this.cancelDelete();
    }
  }

  changeStatus(task: Task, status: TaskStatus): void {
    if (status === task.status) {
      return;
    }
    this.taskService.setStatus(task.id, status).subscribe({
      next: (updated) =>
        this.tasks.update((list) =>
          list.map((t) => (t.id === updated.id ? { ...t, status: updated.status } : t))
        ),
    });
  }

  askDelete(task: Task): void {
    this.taskToDelete.set(task);
  }

  cancelDelete(): void {
    this.taskToDelete.set(null);
  }

  confirmDelete(): void {
    const task = this.taskToDelete();
    if (!task) {
      return;
    }
    this.taskService.remove(task.id).subscribe({
      next: () => {
        this.tasks.update((list) => list.filter((t) => t.id !== task.id));
        this.taskToDelete.set(null);
      },
      error: () => this.taskToDelete.set(null),
    });
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.title = '';
    this.description = '';
    this.tags = '';
    this.assigneeId = this.currentUserId;
    this.status = 'PENDENTE';
    this.error.set('');
  }
}
