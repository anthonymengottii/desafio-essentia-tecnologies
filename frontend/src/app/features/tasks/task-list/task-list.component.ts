import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/task.service';
import { Task } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-list',
  imports: [FormsModule, DatePipe],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);

  tasks = signal<Task[]>([]);
  pendingCount = computed(() => this.tasks().filter((t) => !t.completed).length);
  loading = signal(false);
  error = signal('');

  // Estado do formulário (criação/edição)
  editingId = signal<number | null>(null);
  title = '';
  description = '';
  tags = '';

  ngOnInit(): void {
    this.load();
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
        this.resetForm();
        this.load();
      },
      error: (err) => this.error.set(err?.error?.error ?? 'Erro ao salvar tarefa'),
    });
  }

  startEdit(task: Task): void {
    this.editingId.set(task.id);
    this.title = task.title;
    this.description = task.description ?? '';
    this.tags = task.meta?.tags?.join(', ') ?? '';
  }

  cancelEdit(): void {
    this.resetForm();
  }

  toggle(task: Task): void {
    this.taskService.toggleComplete(task.id).subscribe({
      next: (updated) =>
        this.tasks.update((list) =>
          list.map((t) => (t.id === updated.id ? { ...t, completed: updated.completed } : t))
        ),
    });
  }

  remove(task: Task): void {
    if (!confirm(`Excluir a tarefa "${task.title}"?`)) {
      return;
    }
    this.taskService.remove(task.id).subscribe({
      next: () => this.tasks.update((list) => list.filter((t) => t.id !== task.id)),
    });
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.title = '';
    this.description = '';
    this.tags = '';
    this.error.set('');
  }
}
