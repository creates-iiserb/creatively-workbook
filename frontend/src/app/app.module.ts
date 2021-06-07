import { BrowserAnimationsModule } from "@angular/platform-browser/animations"; // this is needed!
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { RouterModule } from "@angular/router";
import { AppRoutingModule } from "./app.routing";

import { HttpClientModule } from "@angular/common/http";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { ToastrModule } from "ngx-toastr";

import { AppComponent } from "./app.component";
import { NavbarComponent } from "./shared/navbar/navbar.component";

//Global - Quiz Data
import { Global } from "./global";
import { AlertMessageComponent } from "./alert-message/alert-message.component";

import { CustomNavComponent } from "./shared/custom-nav/custom-nav.component";

//For social login
import {
  SocialLoginModule,
  AuthServiceConfig,
  LoginOpt,
} from "angularx-social-login";
import {
  GoogleLoginProvider,
  FacebookLoginProvider,
} from "angularx-social-login";
import { Language } from "./language";
import { BrowserModule } from "@angular/platform-browser";

// import { WhiteboardModule } from './whiteboard/whiteboard.module';

const fbLoginOptions: LoginOpt = {
  scope: "email,user_location",
  return_scopes: true,
  enable_profile_selector: true,
};

let config = new AuthServiceConfig([
  {
    id: GoogleLoginProvider.PROVIDER_ID,
    provider: new GoogleLoginProvider(
      "998389535624-vhpm1mbvkm1l9kob64mr58m6k73l06dd.apps.googleusercontent.com"
    ),
  },
  // {
  //   id: FacebookLoginProvider.PROVIDER_ID,
  //   provider: new FacebookLoginProvider("513346442821314",fbLoginOptions)
  // }
]);

export function provideConfig() {
  return config;
}

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    AlertMessageComponent,
    CustomNavComponent,
  ],
  imports: [
    BrowserAnimationsModule,
    ToastrModule.forRoot({ preventDuplicates: true }),
    NgbModule,
    BrowserModule,
    RouterModule,
    HttpClientModule,
    AppRoutingModule,
    DragDropModule,
    SocialLoginModule,
    // StoreModule,
    // HomeModule,
    // AccountModule,
    // QuizModule,
    // WhiteboardModule
  ],
  providers: [
    Global,
    Language,
    {
      provide: AuthServiceConfig,
      useFactory: provideConfig,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
