import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ToastService] });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a success toast', () => {
    service.success('Tudo certo!');
    const list = service.list();
    expect(list.length).toBe(1);
    expect(list[0].message).toBe('Tudo certo!');
    expect(list[0].type).toBe('success');
  });

  it('should add an error toast', () => {
    service.error('Algo deu errado');
    expect(service.list()[0].type).toBe('error');
  });

  it('should add an info toast', () => {
    service.info('Informação');
    expect(service.list()[0].type).toBe('info');
  });

  it('should dismiss a toast by id', () => {
    service.info('Remover');
    const id = service.list()[0].id;
    service.dismiss(id);
    expect(service.list().length).toBe(0);
  });
});
