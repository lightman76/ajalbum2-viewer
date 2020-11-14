import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PhotoListComponent} from "./components/photo-list/photo-list.component";
import {IndividualPhotoComponent} from "./components/individiual-photo/individual-photo-component";

const routes: Routes = [
  {path: "", component: PhotoListComponent, pathMatch: "full"},
  {path: "photo/:photoId", component: IndividualPhotoComponent},
  {path: "**", component: PhotoListComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
