import { TestBed, async, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { MSAL_INSTANCE, MsalService } from '@azure/msal-angular';
import { PublicClientApplication } from '@azure/msal-browser';

const msalInstanceFactory = () => new PublicClientApplication({
    auth: {
      clientId: '2e4e5b48-6fbe-4193-8bb3-cd46120c54e1',
      redirectUri: 'http://localhost:4200'
    }
  });

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        MsalService,
        {
          provide: MSAL_INSTANCE,
          useFactory: msalInstanceFactory
        }
      ]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Angular 11 - Angular v2 Sample'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Angular 11 - Angular v2 Sample');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.title').textContent).toContain('Angular 11 - Angular v2 Sample');
  });
});
