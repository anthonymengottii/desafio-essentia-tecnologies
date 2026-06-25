import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  User as UserIcon,
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  X,
  Calendar,
} from 'lucide-angular';
import { TaskService } from '../../../core/task.service';
import { UserService } from '../../../core/user.service';
import { AuthService } from '../../../core/auth/auth.service';
import {
  ChecklistItem,
  STATUS_LABELS,
  STATUS_OPTIONS,
  Task,
  TaskStatus,
} from '../../../core/models/task.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-task-list',
  imports: [FormsModule, DatePipe, LucideAngularModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
})
export class TaskListComponent implements OnInit {
  readonly UserIcon = UserIcon;
  readonly ArrowRightIcon = ArrowRight;
  readonly PlusIcon = Plus;
  readonly PencilIcon = Pencil;
  readonly Trash2Icon = Trash2;
  readonly XIcon = X;
  readonly CalendarIcon = Calendar;

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
  dueDate = ''; // formato yyyy-MM-dd (input date)
  formChecklist: ChecklistItem[] = [];
  newFormChecklistText = '';

  // Estado do modal de exclusão
  taskToDelete = signal<Task | null>(null);

  // Estado do modal de detalhes
  detailTask = signal<Task | null>(null);
  detailLoading = signal(false);
  newChecklistText = '';

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
      dueDate: this.dueDate ? new Date(this.dueDate).toISOString() : null,
      tags: this.tags
        ? this.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined,
      checklist: this.formChecklist,
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

  openDetails(task: Task): void {
    this.detailTask.set(task);
    // Busca dados completos (metadados + histórico) que a listagem não traz.
    this.detailLoading.set(true);
    this.taskService.getById(task.id).subscribe({
      next: (full) => {
        this.detailTask.set(full);
        this.detailLoading.set(false);
      },
      error: () => this.detailLoading.set(false),
    });
  }

  closeDetails(): void {
    this.detailTask.set(null);
  }

  editFromDetails(): void {
    const task = this.detailTask();
    if (!task) {
      return;
    }
    this.closeDetails();
    this.startEdit(task);
  }

  /** True se a tarefa tem prazo vencido e ainda não foi concluída. */
  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'CONCLUIDA') {
      return false;
    }
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  /** Progresso da checklist para exibir barra no card. Null se não houver itens. */
  cardProgress(task: Task): { done: number; total: number; percent: number } | null {
    const items = task.meta?.checklist ?? [];
    if (!items.length) {
      return null;
    }
    const done = items.filter((i) => i.done).length;
    return { done, total: items.length, percent: Math.round((done / items.length) * 100) };
  }

  // ===== Checklist (gerenciada no modal de detalhes) =====
  checklist(): ChecklistItem[] {
    return this.detailTask()?.meta?.checklist ?? [];
  }

  checklistProgress(): { done: number; total: number } {
    const items = this.checklist();
    return { done: items.filter((i) => i.done).length, total: items.length };
  }

  addChecklistItem(): void {
    const text = this.newChecklistText.trim();
    if (!text) {
      return;
    }
    this.persistChecklist([...this.checklist(), { text, done: false }]);
    this.newChecklistText = '';
  }

  toggleChecklistItem(index: number): void {
    const items = this.checklist().map((item, i) =>
      i === index ? { ...item, done: !item.done } : item
    );
    this.persistChecklist(items);
  }

  removeChecklistItem(index: number): void {
    this.persistChecklist(this.checklist().filter((_, i) => i !== index));
  }

  /** Atualiza a checklist localmente (otimista) e persiste na API. */
  private persistChecklist(checklist: ChecklistItem[]): void {
    const task = this.detailTask();
    if (!task) {
      return;
    }
    const meta = task.meta ?? { taskId: task.id, tags: [], activityLog: [] };
    this.detailTask.set({ ...task, meta: { ...meta, checklist } });
    this.taskService.update(task.id, { checklist }).subscribe();
  }

  startEdit(task: Task): void {
    this.editingId.set(task.id);
    this.title = task.title;
    this.description = task.description ?? '';
    this.tags = task.meta?.tags?.join(', ') ?? '';
    this.assigneeId = task.assigneeId ?? null;
    this.status = task.status;
    this.dueDate = task.dueDate ? task.dueDate.substring(0, 10) : '';
    this.formChecklist = (task.meta?.checklist ?? []).map((i) => ({ ...i }));
    this.error.set('');
    this.modalOpen.set(true);
  }

  // Checklist dentro do formulário (criação/edição) — salva junto no submit.
  addFormChecklistItem(): void {
    const text = this.newFormChecklistText.trim();
    if (!text) {
      return;
    }
    this.formChecklist = [...this.formChecklist, { text, done: false }];
    this.newFormChecklistText = '';
  }

  toggleFormChecklistItem(index: number): void {
    this.formChecklist = this.formChecklist.map((item, i) =>
      i === index ? { ...item, done: !item.done } : item
    );
  }

  removeFormChecklistItem(index: number): void {
    this.formChecklist = this.formChecklist.filter((_, i) => i !== index);
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
    if (this.detailTask()) {
      this.closeDetails();
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
    this.dueDate = '';
    this.formChecklist = [];
    this.newFormChecklistText = '';
    this.error.set('');
  }
}
