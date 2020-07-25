import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PhotoListComponent } from "./components/photo-list/photo-list.component";
import {ConfigService} from "./services/config.service";
import {PhotoService} from "./services/photo.service";
import {PhotoResultSetService} from "./services/photo-result-set.service";
import {PhotosForDayComponent} from "./components/photos-for-day/photos-for-day.component";
import {PhotoThumbComponent} from "./components/photo-thumb/photo-thumb.component";

@NgModule({
  declarations: [
    AppComponent,
    PhotoListComponent,
    PhotosForDayComponent,
    PhotoThumbComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
  ],
  providers: [
    ConfigService,
    PhotoService,
    PhotoResultSetService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
