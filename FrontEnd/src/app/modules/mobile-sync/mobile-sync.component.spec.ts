import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileSyncComponent } from './mobile-sync.component';

describe('MobileSyncComponent', () => {
  let component: MobileSyncComponent;
  let fixture: ComponentFixture<MobileSyncComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileSyncComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MobileSyncComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
