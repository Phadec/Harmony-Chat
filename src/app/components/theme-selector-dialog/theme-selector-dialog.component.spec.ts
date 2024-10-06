import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeSelectorDialogComponent } from './theme-selector-dialog.component';

describe('ThemeSelectorDialogComponent', () => {
  let component: ThemeSelectorDialogComponent;
  let fixture: ComponentFixture<ThemeSelectorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ThemeSelectorDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThemeSelectorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
