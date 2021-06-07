import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { WboardComponent } from "./wboard/wboard.component";
import { SharedModule } from "app/shared/shared/shared.module";

@NgModule({
  declarations: [WboardComponent],
  imports: [SharedModule],
  exports: [WboardComponent],
})
export class WhiteboardModule {}
