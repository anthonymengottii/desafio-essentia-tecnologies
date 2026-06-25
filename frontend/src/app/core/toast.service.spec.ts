import { fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  it('adiciona toast de sucesso', () => {
    const svc = new ToastService();
    svc.success('ok');
    expect(svc.toasts().length).toBe(1);
    expect(svc.toasts()[0].type).toBe('success');
    expect(svc.toasts()[0].message).toBe('ok');
  });

  it('adiciona toast de erro', () => {
    const svc = new ToastService();
    svc.error('falhou');
    expect(svc.toasts()[0].type).toBe('error');
  });

  it('dismiss remove o toast pelo id', () => {
    const svc = new ToastService();
    svc.success('a');
    const id = svc.toasts()[0].id;
    svc.dismiss(id);
    expect(svc.toasts().length).toBe(0);
  });

  it('auto-dismiss remove após o tempo', fakeAsync(() => {
    const svc = new ToastService();
    svc.success('temporário');
    expect(svc.toasts().length).toBe(1);
    tick(3500);
    expect(svc.toasts().length).toBe(0);
  }));
});
