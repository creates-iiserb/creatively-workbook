import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { CommonService } from './common.service'
@Injectable({
  providedIn: 'root'
})
export class RouteguardService implements CanActivate {
  constructor(private cs: CommonService) { }
  canActivate(): boolean {
    if (!this.cs.checkIfUserIsLoggedIn()) {
      this.cs.logoutAndRedirectToLogin();
    }
    return this.cs.checkIfUserIsLoggedIn();
  }
}