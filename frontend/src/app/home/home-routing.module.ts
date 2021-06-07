import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SettingsComponent } from './settings/settings.component';
import { WbdashboardComponent } from './wbdashboard/wbdashboard.component';
import { WorksheetComponent } from './worksheet/worksheet.component';
const routes: Routes = [
  {
    path: 'library',
    component: DashboardComponent
  },
  {
    path: 'profile',
    component: SettingsComponent
  },
  {
    path: 'wb/:subrId',
    component: WbdashboardComponent
  },
  {
    path: 'wb/:subrId/:wsId',
    component: WorksheetComponent
  },
  { path: '', redirectTo: 'library', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
