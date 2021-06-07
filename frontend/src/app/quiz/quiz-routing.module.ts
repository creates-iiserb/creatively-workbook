import { NgModule, Input } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InstructionComponent } from './instruction/instruction.component';
import { MainComponent } from './playquiz/playquiz.component';

const routes:Routes = [
    {
        path: 'inst',
        component: InstructionComponent
    },
    {
        path: 'play',
        component: MainComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class QuizRoutingModule {

}