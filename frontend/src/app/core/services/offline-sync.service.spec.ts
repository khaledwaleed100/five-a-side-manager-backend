import { TestBed } from '@angular/core/testing';

import { OfflineSyncService } from './offline-sync.service';

describe('OfflineSyncService', () => {
  let service: OfflineSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfflineSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
