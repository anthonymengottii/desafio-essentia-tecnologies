import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {
  LucideAngularModule,
  User as UserIcon,
  ArrowRight,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-angular';
import { TasksStore } from '../tasks.store';
import { TaskModalsComponent } from '../task-modals/task-modals.component';
import { TaskFiltersComponent } from '../task-filters/task-filters.component';
import { Task, TaskStatus } from '../../../core/models/task.model';

@Component({
  selector: 'app-kanban',
  imports: [
    DatePipe,
    LucideAngularModule,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    TaskModalsComponent,
    TaskFiltersComponent,
  ],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.css',
})
export class KanbanComponent implements OnInit {
  readonly UserIcon = UserIcon;
  readonly ArrowRightIcon = ArrowRight;
  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;
  readonly CalendarIcon = Calendar;

  readonly store = inject(TasksStore);

  ngOnInit(): void {
    this.store.init();
  }

  drop(event: CdkDragDrop<TaskStatus>, target: TaskStatus): void {
    const task = event.item.data as Task;
    const source = event.previousContainer.data;

    if (event.previousContainer === event.container) {
      // Reordena dentro da mesma coluna.
      const ids = this.store.tasksByStatus(target).map((t) => t.id);
      moveItemInArray(ids, event.previousIndex, event.currentIndex);
      this.store.applyReorder({ [target]: ids }, task.id, target);
      return;
    }

    // Move entre colunas: atualiza origem e destino.
    const sourceIds = this.store.tasksByStatus(source).map((t) => t.id);
    const targetIds = this.store.tasksByStatus(target).map((t) => t.id);
    transferArrayItem(sourceIds, targetIds, event.previousIndex, event.currentIndex);
    this.store.applyReorder({ [source]: sourceIds, [target]: targetIds }, task.id, target);
  }
}
