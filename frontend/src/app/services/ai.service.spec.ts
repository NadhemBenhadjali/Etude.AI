import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AiService } from './ai.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AiService', () => {
    let service: AiService;
    let httpMock: HttpTestingController;
    let authServiceSpy: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('AuthService', ['getToken']);
        // Mock getToken to return a promise resolving to a token
        spy.getToken.and.returnValue(Promise.resolve('fake-token'));

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                AiService,
                { provide: AuthService, useValue: spy }
            ]
        });
        service = TestBed.inject(AiService);
        httpMock = TestBed.inject(HttpTestingController);
        authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('generateSummary should post to /summary', fakeAsync(() => {
        const mockResponse = { data: 'summary' };

        service.generateSummary('Math', 'Algebra').subscribe(result => {
            expect(result).toEqual(mockResponse);
        });

        // Advance time to allow the Promise in switchMap to resolve
        tick();

        const req = httpMock.expectOne(`${environment.apiBase}/summary`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ subject: 'Math', module: 'Algebra' });
        expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');

        req.flush(mockResponse);
    }));

    it('askQuestion should post to /qa', fakeAsync(() => {
        const mockResponse = { answer: '42' };

        service.askQuestion('Why?').subscribe(result => {
            expect(result).toEqual(mockResponse);
        });

        tick();

        const req = httpMock.expectOne(`${environment.apiBase}/qa`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ question: 'Why?' });
        req.flush(mockResponse);
    }));
});
