import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {PhotoListComponent} from "./components/photo-list/photo-list.component";

const routes: Routes = [
  {path: "", component: PhotoListComponent, pathMatch: "full"},
  {path: "**", component: PhotoListComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
