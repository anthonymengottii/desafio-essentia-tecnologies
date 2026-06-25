import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
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
    if (event.previousContainer === event.container) {
      return;
    }
    const task = event.item.data as Task;
    this.store.changeStatus(task, target);
  }
}
