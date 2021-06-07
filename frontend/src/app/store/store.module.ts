import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { StoreRoutingModule } from "./store-routing.module";
import { ListComponent } from "./list/list.component";
import { DetailsComponent } from "./details/details.component";
import { SharedModule } from "app/shared/shared/shared.module";
import { BetalistComponent } from "./betalist/betalist.component";
import { BetawbdetailsComponent } from "./betawbdetails/betawbdetails.component";

@NgModule({
  imports: [StoreRoutingModule, SharedModule],
  declarations: [
    ListComponent,
    DetailsComponent,
    BetalistComponent,
    BetawbdetailsComponent,
  ],
})
export class StoreModule {}
