import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MathComponent } from './math/math.component';

@NgModule({
  declarations: [MathComponent],
  imports: [
    CommonModule
  ],
  exports: [MathComponent]
})
export class MathjaxModule { }
