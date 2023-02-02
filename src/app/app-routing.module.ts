import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PhotoListComponent} from "./components/photo-list/photo-list.component";
import {IndividualPhotoComponent} from "./components/individiual-photo/individual-photo-component";
import {DefaultUserComponent} from './components/default-user/default-user.component';

const routes: Routes = [
  {path: "", component: DefaultUserComponent, pathMatch: "full"},
  {path: ":userName/photo/:photoId", component: IndividualPhotoComponent},
  {path: ":userName/list", component: PhotoListComponent},

  //{path: "**", component: DefaultUserComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
