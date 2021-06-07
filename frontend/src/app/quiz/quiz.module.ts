import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { QuizRoutingModule } from "./quiz-routing.module";
import { InstructionComponent } from "./instruction/instruction.component";
import { MainComponent } from "./playquiz/playquiz.component";
import { McqComponent } from "./mcq/mcq.component";
import { ArrangeComponent } from "./arrange/arrange.component";
import { FillinComponent } from "./fillin/fillin.component";
//import { MathjaxModule } from '../mathjax/mathjax.module';
import { DragDropModule } from "@angular/cdk/drag-drop";
import { SharedModule } from "app/shared/shared/shared.module";
import { InfoComponent } from "./info/info.component";
import { CKEditorModule } from "ckeditor4-angular";
import { SubjectiveComponent } from "./subjective/subjective.component";

@NgModule({
  declarations: [
    InstructionComponent,
    MainComponent,
    McqComponent,
    ArrangeComponent,
    FillinComponent,
    InfoComponent,
    SubjectiveComponent,
  ],
  imports: [QuizRoutingModule, DragDropModule, SharedModule, CKEditorModule],
})
export class QuizModule {}
