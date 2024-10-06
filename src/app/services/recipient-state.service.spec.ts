import { TestBed } from '@angular/core/testing';

import { RecipientStateService } from './recipient-state.service';

describe('RecipientStateService', () => {
  let service: RecipientStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecipientStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
