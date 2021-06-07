import { NgModule } from "@angular/core";

import { Routes, RouterModule } from "@angular/router";
import { RouteguardService as AuthGuard } from "./services/routeguard.service";

const routes: Routes = [
  {
    path: "store",
    loadChildren: "./store/store.module#StoreModule",
  },
  {
    path: "home",
    loadChildren: "./home/home.module#HomeModule",
    canActivate: [AuthGuard],
  },
  {
    path: "account",
    loadChildren: "./account/account.module#AccountModule",
  },
  {
    path: "quiz",
    loadChildren: "./quiz/quiz.module#QuizModule",
    // canActivate :[AuthGuard]
  },
  // {
  //   path: '',
  //   redirectTo: 'store',
  //   pathMatch: 'full'
  // },
  { path: "", redirectTo: "store", pathMatch: "full" },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
