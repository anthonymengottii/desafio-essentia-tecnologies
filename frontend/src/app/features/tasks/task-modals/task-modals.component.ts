import { Component, HostListener, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { LucideAngularModule, Plus, Pencil, X } from 'lucide-angular';
import { TasksStore } from '../tasks.store';

/** Modais compartilhados (criar/editar, detalhes e excluir) controlados pelo TasksStore. */
@Component({
  selector: 'app-task-modals',
  imports: [FormsModule, DatePipe, LucideAngularModule, A11yModule],
  templateUrl: './task-modals.component.html',
})
export class TaskModalsComponent {
  readonly PlusIcon = Plus;
  readonly PencilIcon = Pencil;
  readonly XIcon = X;

  readonly store = inject(TasksStore);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.store.closeAnyModal();
  }
}
