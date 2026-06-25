import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tasks/task-list/task-list.component').then((m) => m.TaskListComponent),
  },
  {
    path: 'kanban',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tasks/kanban/kanban.component').then((m) => m.KanbanComponent),
  },
  { path: '**', redirectTo: 'tasks' },
];
