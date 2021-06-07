import { TestBed } from '@angular/core/testing';

import { FourmsService } from './fourms.service';

describe('FourmsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FourmsService = TestBed.get(FourmsService);
    expect(service).toBeTruthy();
  });
});
