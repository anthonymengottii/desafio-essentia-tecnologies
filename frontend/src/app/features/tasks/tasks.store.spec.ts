import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TasksStore } from './tasks.store';
import { TaskService } from '../../core/task.service';
import { UserService } from '../../core/user.service';
import { AuthService } from '../../core/auth/auth.service';
import { Task, TaskStatus } from '../../core/models/task.model';

function makeTask(p: Partial<Task>): Task {
  return {
    id: 1,
    title: 'Tarefa',
    description: null,
    status: 'PENDENTE',
    order: 0,
    dueDate: null,
    creatorId: 1,
    assigneeId: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...p,
  } as Task;
}

describe('TasksStore', () => {
  let store: TasksStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TasksStore,
        { provide: TaskService, useValue: { list: () => of([]), getById: () => of(null), update: () => of(null) } },
        { provide: UserService, useValue: { list: () => of([]) } },
        { provide: AuthService, useValue: { user: () => ({ id: 1, name: 'Eu', email: 'eu@x.com' }) } },
      ],
    });
    store = TestBed.inject(TasksStore);
  });

  it('isOverdue: prazo passado e não concluída → true', () => {
    expect(store.isOverdue(makeTask({ dueDate: '2020-01-01T00:00:00.000Z' }))).toBe(true);
  });

  it('isOverdue: concluída nunca está atrasada', () => {
    expect(
      store.isOverdue(makeTask({ dueDate: '2020-01-01T00:00:00.000Z', status: 'CONCLUIDA' }))
    ).toBe(false);
  });

  it('isOverdue: sem prazo → false', () => {
    expect(store.isOverdue(makeTask({ dueDate: null }))).toBe(false);
  });

  it('cardProgress calcula done/total/percent', () => {
    const task = makeTask({
      meta: {
        taskId: 1,
        tags: [],
        activityLog: [],
        checklist: [
          { text: 'a', done: true },
          { text: 'b', done: false },
          { text: 'c', done: true },
        ],
      },
    });
    expect(store.cardProgress(task)).toEqual({ done: 2, total: 3, percent: 67 });
  });

  it('cardProgress retorna null sem checklist', () => {
    expect(store.cardProgress(makeTask({}))).toBeNull();
  });

  it('filteredTasks aplica busca por título', () => {
    store.tasks.set([
      makeTask({ id: 1, title: 'Comprar pão' }),
      makeTask({ id: 2, title: 'Estudar Angular' }),
    ]);
    store.search.set('angular');
    const result = store.filteredTasks();
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(2);
  });

  it('filteredTasks aplica filtro de status', () => {
    store.tasks.set([
      makeTask({ id: 1, status: 'PENDENTE' }),
      makeTask({ id: 2, status: 'CONCLUIDA' }),
    ]);
    store.filterStatus.set('CONCLUIDA' as TaskStatus);
    expect(store.filteredTasks().map((t) => t.id)).toEqual([2]);
  });

  it('ordena por título quando sortBy = title', () => {
    store.tasks.set([
      makeTask({ id: 1, title: 'Banana' }),
      makeTask({ id: 2, title: 'Abacaxi' }),
    ]);
    store.sortBy.set('title');
    expect(store.filteredTasks().map((t) => t.title)).toEqual(['Abacaxi', 'Banana']);
  });

  it('tasksByStatus ignora o filtro de status (usado pelo Kanban)', () => {
    store.tasks.set([
      makeTask({ id: 1, status: 'PENDENTE' }),
      makeTask({ id: 2, status: 'CONCLUIDA' }),
    ]);
    store.filterStatus.set('CONCLUIDA' as TaskStatus);
    // mesmo com filtro de status ativo, a coluna PENDENTE ainda traz a tarefa 1
    expect(store.tasksByStatus('PENDENTE').map((t) => t.id)).toEqual([1]);
  });

  it('clearFilters reseta busca/escopo/responsável/status', () => {
    store.search.set('x');
    store.scope.set('mine');
    store.filterStatus.set('CONCLUIDA' as TaskStatus);
    store.clearFilters();
    expect(store.search()).toBe('');
    expect(store.scope()).toBe('all');
    expect(store.filterStatus()).toBe('all');
    expect(store.hasActiveFilters()).toBe(false);
  });

  it('scope "mine" mostra só tarefas atribuídas ao usuário atual', () => {
    store.tasks.set([
      makeTask({ id: 1, assigneeId: 1, creatorId: 2 }),
      makeTask({ id: 2, assigneeId: 2, creatorId: 1 }),
    ]);
    store.scope.set('mine');
    expect(store.filteredTasks().map((t) => t.id)).toEqual([1]);
  });

  it('scope "created" mostra só tarefas criadas pelo usuário atual', () => {
    store.tasks.set([
      makeTask({ id: 1, assigneeId: 1, creatorId: 2 }),
      makeTask({ id: 2, assigneeId: 2, creatorId: 1 }),
    ]);
    store.scope.set('created');
    expect(store.filteredTasks().map((t) => t.id)).toEqual([2]);
  });

  it('pagedTasks limita ao pageSize e nextPage avança', () => {
    const many = Array.from({ length: 20 }, (_, i) => makeTask({ id: i + 1 }));
    store.tasks.set(many);
    expect(store.pagedTasks().length).toBe(store.pageSize);
    expect(store.totalPages()).toBe(3);
    store.nextPage();
    expect(store.page()).toBe(2);
  });
});
