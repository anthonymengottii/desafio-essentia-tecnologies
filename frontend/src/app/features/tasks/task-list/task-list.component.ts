import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
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

@Component({
  selector: 'app-task-list',
  imports: [DatePipe, LucideAngularModule, TaskModalsComponent, TaskFiltersComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
})
export class TaskListComponent implements OnInit {
  readonly UserIcon = UserIcon;
  readonly ArrowRightIcon = ArrowRight;
  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;
  readonly CalendarIcon = Calendar;

  readonly store = inject(TasksStore);

  ngOnInit(): void {
    this.store.init();
  }
}
