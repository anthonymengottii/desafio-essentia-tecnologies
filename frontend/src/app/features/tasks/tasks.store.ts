import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { TaskService } from '../../core/task.service';
import { UserService } from '../../core/user.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/toast.service';
import { FieldErrors, parseApiError } from '../../core/http-error';
import {
  ChecklistItem,
  STATUS_LABELS,
  STATUS_OPTIONS,
  Task,
  TaskStatus,
} from '../../core/models/task.model';
import { User } from '../../core/models/user.model';

export type SortBy = 'createdAt' | 'dueDate' | 'title';
export type Scope = 'all' | 'mine' | 'created';

/**
 * Estado e ações compartilhados das tarefas (usados pela Lista e pelo Kanban),
 * incluindo os modais de criação/edição, detalhes e exclusão.
 */
@Injectable({ providedIn: 'root' })
export class TasksStore {
  private taskService = inject(TaskService);
  private userService = inject(UserService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly currentUserId = this.auth.user()?.id ?? null;
  readonly statusLabels = STATUS_LABELS;
  readonly statusOptions = STATUS_OPTIONS;

  tasks = signal<Task[]>([]);
  users = signal<User[]>([]);
  loading = signal(false);
  error = signal('');

  // Busca / filtros / ordenação
  search = signal('');
  scope = signal<Scope>('all');
  filterAssignee = signal<number | 'all'>('all');
  filterStatus = signal<TaskStatus | 'all'>('all');
  sortBy = signal<SortBy>('createdAt');

  hasActiveFilters = computed(
    () =>
      this.search().trim() !== '' ||
      this.scope() !== 'all' ||
      this.filterAssignee() !== 'all' ||
      this.filterStatus() !== 'all'
  );

  /** Tarefas após busca + escopo + responsável + status, ordenadas (usado pela Lista). */
  filteredTasks = computed(() => this.applyFilters(true));

  pendingCount = computed(() => this.tasks().filter((t) => t.status !== 'CONCLUIDA').length);

  // Paginação (apenas Lista)
  readonly pageSize = 8;
  page = signal(1);
  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredTasks().length / this.pageSize)));
  pagedTasks = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredTasks().slice(start, start + this.pageSize);
  });

  constructor() {
    // Volta para a primeira página sempre que o conjunto filtrado muda.
    effect(() => {
      this.filteredTasks();
      this.page.set(1);
    });
  }

  nextPage(): void {
    this.page.update((p) => Math.min(p + 1, this.totalPages()));
  }

  prevPage(): void {
    this.page.update((p) => Math.max(p - 1, 1));
  }

  // Modal de formulário (criação/edição)
  modalOpen = signal(false);
  editingId = signal<number | null>(null);
  title = '';
  description = '';
  tags = '';
  assigneeId: number | null = null;
  status: TaskStatus = 'PENDENTE';
  dueDate = '';
  formChecklist: ChecklistItem[] = [];
  newFormChecklistText = '';

  // Modal de exclusão
  taskToDelete = signal<Task | null>(null);

  // Modal de detalhes
  detailTask = signal<Task | null>(null);
  detailLoading = signal(false);
  newChecklistText = '';

  // Erros de validação por campo no formulário de tarefa
  formFieldErrors = signal<FieldErrors>({});

  formErrorsFor(field: string): string[] {
    return this.formFieldErrors()[field] ?? [];
  }

  init(): void {
    this.load();
    if (!this.users().length) {
      this.userService.list().subscribe({ next: (users) => this.users.set(users) });
    }
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

  /** Aplica busca + responsável (+ status opcional) e ordena. */
  private applyFilters(includeStatus: boolean): Task[] {
    const q = this.search().trim().toLowerCase();
    const scope = this.scope();
    const assignee = this.filterAssignee();
    const status = this.filterStatus();
    const me = this.currentUserId;

    const list = this.tasks().filter((t) => {
      if (q && !`${t.title} ${t.description ?? ''}`.toLowerCase().includes(q)) {
        return false;
      }
      if (scope === 'mine' && t.assigneeId !== me) {
        return false;
      }
      if (scope === 'created' && t.creatorId !== me) {
        return false;
      }
      if (assignee !== 'all' && t.assigneeId !== assignee) {
        return false;
      }
      if (includeStatus && status !== 'all' && t.status !== status) {
        return false;
      }
      return true;
    });

    return this.sortTasks(list);
  }

  private sortTasks(list: Task[]): Task[] {
    const by = this.sortBy();
    return [...list].sort((a, b) => {
      if (by === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (by === 'dueDate') {
        // sem prazo vai para o fim
        if (!a.dueDate) return b.dueDate ? 1 : 0;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      return b.createdAt.localeCompare(a.createdAt); // createdAt desc
    });
  }

  /** Tarefas de uma coluna do Kanban: busca + responsável, ordenadas pela posição manual (`order`). */
  tasksByStatus(status: TaskStatus): Task[] {
    return this.applyFilters(false)
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order);
  }

  clearFilters(): void {
    this.search.set('');
    this.scope.set('all');
    this.filterAssignee.set('all');
    this.filterStatus.set('all');
  }

  // ===== Helpers de exibição =====
  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'CONCLUIDA') {
      return false;
    }
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  cardProgress(task: Task): { done: number; total: number; percent: number } | null {
    const items = task.meta?.checklist ?? [];
    if (!items.length) {
      return null;
    }
    const done = items.filter((i) => i.done).length;
    return { done, total: items.length, percent: Math.round((done / items.length) * 100) };
  }

  // ===== Reordenação / movimentação no Kanban =====
  /**
   * Persiste a nova ordem das colunas afetadas (optimista). `orderedByStatus` mapeia
   * cada status para a lista de ids na nova ordem; `movedId` muda de status se necessário.
   */
  applyReorder(
    orderedByStatus: Partial<Record<TaskStatus, number[]>>,
    movedId: number,
    movedStatus: TaskStatus
  ): void {
    const orderById = new Map<number, number>();
    const statusById = new Map<number, TaskStatus>();
    for (const [status, ids] of Object.entries(orderedByStatus)) {
      (ids ?? []).forEach((id, index) => {
        orderById.set(id, index);
        statusById.set(id, status as TaskStatus);
      });
    }

    // Atualização local imediata.
    this.tasks.update((list) =>
      list.map((t) => {
        if (!orderById.has(t.id)) {
          return t;
        }
        return {
          ...t,
          order: orderById.get(t.id)!,
          status: t.id === movedId ? movedStatus : statusById.get(t.id) ?? t.status,
        };
      })
    );

    const updates = [...orderById.entries()].map(([id, order]) => ({
      id,
      order,
      ...(id === movedId ? { status: movedStatus } : {}),
    }));

    this.taskService.reorder(updates).subscribe({
      error: () => {
        this.toast.error('Erro ao reordenar tarefas');
        this.load();
      },
    });
  }

  // ===== Formulário =====
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
    this.dueDate = task.dueDate ? task.dueDate.substring(0, 10) : '';
    this.formChecklist = (task.meta?.checklist ?? []).map((i) => ({ ...i }));
    this.error.set('');
    this.formFieldErrors.set({});
    this.modalOpen.set(true);
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
      tags: this.tags ? this.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      checklist: this.formChecklist,
    };

    const id = this.editingId();
    const req = id ? this.taskService.update(id, input) : this.taskService.create(input);

    req.subscribe({
      next: () => {
        this.toast.success(id ? 'Tarefa atualizada' : 'Tarefa criada');
        this.closeModal();
        this.load();
      },
      error: (err) => {
        const parsed = parseApiError(err, 'Erro ao salvar tarefa');
        this.formFieldErrors.set(parsed.fieldErrors);
        this.error.set(Object.keys(parsed.fieldErrors).length ? '' : parsed.message);
        if (!Object.keys(parsed.fieldErrors).length) {
          this.toast.error(parsed.message);
        }
      },
    });
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.resetForm();
  }

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
    this.formFieldErrors.set({});
  }

  // ===== Detalhes =====
  openDetails(task: Task): void {
    this.detailTask.set(task);
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

  private persistChecklist(checklist: ChecklistItem[]): void {
    const task = this.detailTask();
    if (!task) {
      return;
    }
    const meta = task.meta ?? { taskId: task.id, tags: [], activityLog: [] };
    const updatedMeta = { ...meta, checklist };
    this.detailTask.set({ ...task, meta: updatedMeta });
    // Reflete progresso na listagem/kanban também.
    this.tasks.update((list) =>
      list.map((t) => (t.id === task.id ? { ...t, meta: updatedMeta } : t))
    );
    this.taskService.update(task.id, { checklist }).subscribe({
      error: () => this.toast.error('Erro ao atualizar checklist'),
    });
  }

  // ===== Exclusão =====
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
        this.toast.success('Tarefa excluída');
      },
      error: () => {
        this.taskToDelete.set(null);
        this.toast.error('Erro ao excluir tarefa');
      },
    });
  }

  closeAnyModal(): void {
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
}
