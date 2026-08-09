import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatchService, Match } from './match.service';
import { environment } from '../../../environments/environment';

describe('MatchService', () => {
  let service: MatchService;
  let httpMock: HttpTestingController;

  const mockMatch: Match = {
    _id: 'm1',
    place: 'The Cage',
    date: '2026-09-15',
    time: '18:00',
    roster: [],
    teamA: [],
    teamB: [],
    status: 'upcoming'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MatchService]
    });
    service = TestBed.inject(MatchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getMatches() should call GET /api/matches', () => {
    service.getMatches().subscribe(matches => {
      expect(matches.length).toBe(1);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/matches`);
    expect(req.request.method).toBe('GET');
    req.flush([mockMatch]);
  });

  it('createMatch() should call POST /api/matches', () => {
    service.createMatch({ place: 'Arena', date: '2026-09-16', time: '19:00' }).subscribe(res => {
      expect(res.match).toBeTruthy();
      expect(res.conflictWarning).toBeNull();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/matches`);
    expect(req.request.method).toBe('POST');
    req.flush({ match: mockMatch, conflictWarning: null });
  });

  it('generateTeams() should call POST /api/matches/:id/generate', () => {
    service.generateTeams('m1').subscribe(match => {
      expect(match._id).toBe('m1');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/matches/m1/generate`);
    expect(req.request.method).toBe('POST');
    req.flush(mockMatch);
  });

  it('completeMatch() should call POST /api/matches/:id/complete', () => {
    const payload = { finalScore: { teamA: 3, teamB: 2 }, playerStats: [] };
    service.completeMatch('m1', payload).subscribe(match => {
      expect(match.status).toBe('completed');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/matches/m1/complete`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockMatch, status: 'completed' });
  });
});
