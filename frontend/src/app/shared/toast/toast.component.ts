import { Component, inject } from '@angular/core';
import { LucideAngularModule, CheckCircle, AlertCircle, X } from 'lucide-angular';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-toast',
  imports: [LucideAngularModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
})
export class ToastComponent {
  readonly SuccessIcon = CheckCircle;
  readonly ErrorIcon = AlertCircle;
  readonly XIcon = X;

  readonly toastService = inject(ToastService);
}
