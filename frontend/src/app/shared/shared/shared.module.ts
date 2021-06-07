import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MathComponent } from "../../mathjax/math/math.component";
import { FooterComponent } from "../footer/footer.component";
import { AngularMultiSelectModule } from "angular2-multiselect-dropdown";
import { ParsetimePipe } from "../../pipe/parsetime.pipe";
import { WbfilterPipe } from "app/pipe/filterbetawb.pipe";
import { ForumPipe } from "app/pipe/forum.pipe";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { UtilsPipe } from "app/pipe/utils.pipe";

// import { WhiteboardModule } from 'app/whiteboard/whiteboard.module';
import { WboardComponent } from "../../whiteboard/wboard/wboard.component";
import { SocialshareComponent } from "app/socialshare/socialshare.component";
import { RatingsComponent } from "app/ratings/ratings.component";
import { ForumnotificationPipe } from "app/pipe/forumnotification.pipe";
import { NgxPaginationModule } from "ngx-pagination";
import { InfocardComponent } from "../infocard/infocard.component";

//Plotly.js
// import * as PlotlyJS from 'plotly.js/dist/plotly.js';
// import { PlotlyModule } from 'angular-plotly.js';

// PlotlyModule.plotlyjs = PlotlyJS;

@NgModule({
  declarations: [
    MathComponent,
    FooterComponent,
    WboardComponent,
    ParsetimePipe,
    WbfilterPipe,
    ForumPipe,
    ForumnotificationPipe,
    UtilsPipe,
    SocialshareComponent,
    RatingsComponent,
    InfocardComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    AngularMultiSelectModule,
    NgxPaginationModule,
    //,PlotlyModule
  ],
  exports: [
    MathComponent,
    FooterComponent,
    WboardComponent,
    ParsetimePipe,
    WbfilterPipe,
    ForumnotificationPipe,
    ForumPipe,
    UtilsPipe,
    SocialshareComponent,
    RatingsComponent,
    InfocardComponent,
  ], //,PlotlyModule]
})
export class SharedModule {}
