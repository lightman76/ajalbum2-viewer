import {Injectable, NgModule} from '@angular/core';
import * as Hammer from 'hammerjs';
import {BrowserModule, HAMMER_GESTURE_CONFIG, HammerGestureConfig, HammerModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {PhotoListComponent} from "./components/photo-list/photo-list.component";
import {ConfigService} from "./services/config.service";
import {PhotoService} from "./services/photo.service";
import {PhotoResultSetService} from "./services/photo-result-set.service";
import {PhotosForDayComponent} from "./components/photos-for-day/photos-for-day.component";
import {PhotoThumbComponent} from "./components/photo-thumb/photo-thumb.component";
import {IndividualPhotoComponent} from "./components/individiual-photo/individual-photo-component";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {IndividualPhotoInfoComponent} from "./components/individiual-photo/individual-photo-info.component";

@Injectable()
export class MyHammerConfig extends HammerGestureConfig {
  overrides = <any>{
    swipe: {direction: Hammer.DIRECTION_HORIZONTAL},
  };
}

@NgModule({
  declarations: [
    AppComponent,
    PhotoListComponent,
    PhotosForDayComponent,
    PhotoThumbComponent,
    IndividualPhotoComponent,
    IndividualPhotoInfoComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FontAwesomeModule,
    HammerModule
  ],
  providers: [
    ConfigService,
    PhotoService,
    PhotoResultSetService,
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: MyHammerConfig
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
