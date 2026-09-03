import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast';
import { ToastService } from '../../../core/services/toast.service';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let service: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [ToastService],
    }).compileComponents();

    service = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a toast when one is added', () => {
    service.success('Projeto salvo!');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Projeto salvo!');
  });

  it('should dismiss toast on click', () => {
    service.info('Clique');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector('.toast')?.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect(service.list().length).toBe(0);
  });
});
