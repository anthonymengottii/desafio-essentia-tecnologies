import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideAngularModule,
  List,
  LayoutGrid,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-angular';
import { AuthService } from './core/auth/auth.service';

const SIDEBAR_KEY = 'techx_sidebar_collapsed';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly ListIcon = List;
  readonly KanbanIcon = LayoutGrid;
  readonly LogOutIcon = LogOut;
  readonly CollapseIcon = PanelLeftClose;
  readonly ExpandIcon = PanelLeftOpen;

  readonly auth = inject(AuthService);

  readonly collapsed = signal(localStorage.getItem(SIDEBAR_KEY) === '1');

  toggleSidebar(): void {
    this.collapsed.update((v) => !v);
    localStorage.setItem(SIDEBAR_KEY, this.collapsed() ? '1' : '0');
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

  logout(): void {
    this.auth.logout();
  }
}
