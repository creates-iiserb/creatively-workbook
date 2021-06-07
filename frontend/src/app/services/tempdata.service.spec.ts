import { TestBed } from '@angular/core/testing';

import { TempdataService } from './tempdata.service';

describe('TempdataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TempdataService = TestBed.get(TempdataService);
    expect(service).toBeTruthy();
  });
});
