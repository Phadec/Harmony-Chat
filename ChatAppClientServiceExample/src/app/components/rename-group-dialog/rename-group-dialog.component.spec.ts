import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenameGroupDialogComponent } from './rename-group-dialog.component';

describe('RenameGroupDialogComponent', () => {
  let component: RenameGroupDialogComponent;
  let fixture: ComponentFixture<RenameGroupDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RenameGroupDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RenameGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
