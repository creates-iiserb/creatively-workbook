import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {RegisterComponent} from  './register/register.component'
import {LoginComponent} from  './login/login.component'
import {ResetComponent} from './reset/reset.component'
import {VerifyComponent} from './verify/verify.component'
import {ResetPasswordComponent} from './reset-password/reset-password.component'
const routes: Routes = [
  {
  path: 'signup',
  component: RegisterComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'reset',
    component: ResetComponent
  },
  {
    path: 'verify/:uname/:token',
    component: VerifyComponent
  },
  {
    path: 'reset/:wbuser/:emailToken',
    component: ResetPasswordComponent
  },
  {
    path: '',
    redirectTo: 'signup',
    pathMatch: 'full'
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule { }
