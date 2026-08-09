import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlayerService, Player } from './player.service';
import { environment } from '../../../environments/environment';

describe('PlayerService', () => {
  let service: PlayerService;
  let httpMock: HttpTestingController;

  const mockPlayer: Player = {
    _id: 'p1',
    name: 'Ahmed',
    position: 'FWD',
    overallRating: 78,
    performanceTrend: 'hot',
    attributes: {
      speed: 80, shooting: 85, passing: 70,
      defending: 40, physical: 75, stamina: 80,
      goalkeeping: 30, positioning: 80, longPass: 65, shortPass: 75
    },
    stats: { matchesPlayed: 10, goals: 7, assists: 3, mvpAwards: 2 }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlayerService]
    });
    service = TestBed.inject(PlayerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getPlayers() should call GET /api/players and update signal', () => {
    service.getPlayers().subscribe(players => {
      expect(players.length).toBe(1);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/players`);
    expect(req.request.method).toBe('GET');
    req.flush([mockPlayer]);

    expect(service.players().length).toBe(1);
    expect(service.players()[0].name).toBe('Ahmed');
  });

  it('deletePlayer() should remove player from signal', () => {
    service.players.set([mockPlayer]);

    service.deletePlayer('p1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/players/p1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ id: 'p1' });

    expect(service.players().find(p => p._id === 'p1')).toBeUndefined();
  });

  it('getAiReport() should call GET /api/players/:id/ai-report', () => {
    service.getAiReport('p1').subscribe(res => {
      expect(res.report).toBeTruthy();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/players/p1/ai-report`);
    expect(req.request.method).toBe('GET');
    req.flush({ report: 'Ahmed is on a hot streak!', cached: false });
  });
});
