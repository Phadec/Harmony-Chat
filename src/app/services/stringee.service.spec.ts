import { TestBed } from '@angular/core/testing';

import { StringeeService } from './stringee.service';

describe('StringeeService', () => {
  let service: StringeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StringeeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
