import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { HomeRoutingModule } from "./home-routing.module";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { SettingsComponent } from "./settings/settings.component";
import { WbdashboardComponent } from "./wbdashboard/wbdashboard.component";
import { WorksheetComponent } from "./worksheet/worksheet.component";
import { SharedModule } from "app/shared/shared/shared.module";

@NgModule({
  imports: [HomeRoutingModule, SharedModule],
  declarations: [
    DashboardComponent,
    SettingsComponent,
    WbdashboardComponent,
    WorksheetComponent,
  ],
})
export class HomeModule {}
