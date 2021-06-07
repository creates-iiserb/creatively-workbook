import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {ListComponent} from './list/list.component'
import {DetailsComponent} from './details/details.component';
import { BetalistComponent } from './betalist/betalist.component';
import { BetawbdetailsComponent } from './betawbdetails/betawbdetails.component';

const routes: Routes = [
  {
    path: '',
    component: ListComponent
  },
  {
    path: 'beta',
    component: BetalistComponent
  },
  {
    path: 'beta/:wbId/:pubId',
    component: BetawbdetailsComponent
  },
  {
    path: ':wbId',
    component: DetailsComponent
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StoreRoutingModule { }
