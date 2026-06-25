import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, X } from 'lucide-angular';
import { TasksStore } from '../tasks.store';

@Component({
  selector: 'app-task-filters',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './task-filters.component.html',
  styleUrl: './task-filters.component.css',
})
export class TaskFiltersComponent {
  /** Exibe o filtro de status (apenas na Lista; no Kanban a coluna já é o status). */
  @Input() showStatus = true;

  readonly SearchIcon = Search;
  readonly XIcon = X;

  readonly store = inject(TasksStore);
}
