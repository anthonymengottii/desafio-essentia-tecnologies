import { Component, computed, inject, signal } from '@angular/core';
import {
  Router,
  NavigationEnd,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter } from 'rxjs';
import {
  LucideAngularModule,
  List,
  LayoutGrid,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
} from 'lucide-angular';
import { AuthService } from './core/auth/auth.service';
import { ToastComponent } from './shared/toast/toast.component';

const SIDEBAR_KEY = 'techx_sidebar_collapsed';

const PAGE_TITLES: Record<string, string> = {
  '/tasks': 'Lista de tarefas',
  '/kanban': 'Kanban',
};

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly ListIcon = List;
  readonly KanbanIcon = LayoutGrid;
  readonly LogOutIcon = LogOut;
  readonly CollapseIcon = PanelLeftClose;
  readonly ExpandIcon = PanelLeftOpen;
  readonly MenuIcon = Menu;

  readonly auth = inject(AuthService);
  private router = inject(Router);

  readonly collapsed = signal(localStorage.getItem(SIDEBAR_KEY) === '1');
  readonly mobileOpen = signal(false);
  readonly pageTitle = signal(this.titleFor(this.router.url));

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.pageTitle.set(this.titleFor(e.urlAfterRedirects));
        this.mobileOpen.set(false); // fecha o drawer ao navegar
      });
  }

  toggleMobile(): void {
    this.mobileOpen.update((v) => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  readonly initials = computed(() => {
    const name = this.auth.user()?.name?.trim() ?? '';
    if (!name) {
      return '?';
    }
    const parts = name.split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  });

  toggleSidebar(): void {
    this.collapsed.update((v) => !v);
    localStorage.setItem(SIDEBAR_KEY, this.collapsed() ? '1' : '0');
  }

  logout(): void {
    this.auth.logout();
  }

  private titleFor(url: string): string {
    const path = url.split('?')[0];
    return PAGE_TITLES[path] ?? 'Tarefas';
  }
}
