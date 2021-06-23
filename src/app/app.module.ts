import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import {
  IPublicClientApplication,
  PublicClientApplication, InteractionType,
  BrowserCacheLocation, LogLevel
} from '@azure/msal-browser';
import {
  MsalGuard, MsalInterceptor,
  MsalBroadcastService, MsalInterceptorConfiguration,
  MsalModule, MsalService, MSAL_GUARD_CONFIG,
  MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG,
  MsalGuardConfiguration, MsalRedirectComponent
} from '@azure/msal-angular';
import { DetailComponent } from './detail/detail.component';
import { LogoutComponent } from './logout/logout.component';

const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1
  || window.navigator.userAgent.indexOf('Trident/') > -1; // Remove this line to use Angular Universal

export const loggerCallback = (logLevel: LogLevel, message: string) => {
  console.log(message);
};

export const msalInstanceFactory = (): IPublicClientApplication => new PublicClientApplication({
    auth: {
      clientId: '2e4e5b48-6fbe-4193-8bb3-cd46120c54e1', // PPE testing environment
      authority: 'https://login.microsoftonline.com/common', // Prod environment. Uncomment to use.
      redirectUri: '/',
      postLogoutRedirectUri: '/',
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: isIE, // set to true for IE 11. Remove this line to use Angular Universal
    },
    system: {
      allowRedirectInIframe: true,
      loggerOptions: {
        loggerCallback,
        logLevel: LogLevel.Info,
        piiLoggingEnabled: false
      }
    }
  });

export const msalInterceptorConfigFactory = (): MsalInterceptorConfiguration => {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/me', ['user.read']);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
};

export const msalGuardConfigFactory = (): MsalGuardConfiguration => ({
  interactionType: InteractionType.Redirect,
  authRequest: {
    scopes: ['user.read']
  },
  loginFailedRoute: '/login-failed'
});

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ProfileComponent,
    DetailComponent,
    LogoutComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatButtonModule,
    MatToolbarModule,
    MatListModule,
    MatMenuModule,
    HttpClientModule,
    MsalModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: msalInstanceFactory
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: msalGuardConfigFactory
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: msalInterceptorConfigFactory
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService
  ],
  bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule { }
