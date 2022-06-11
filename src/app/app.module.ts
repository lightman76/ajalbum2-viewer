import {Injectable, NgModule} from '@angular/core';
import * as Hammer from 'hammerjs';
import {BrowserModule, HAMMER_GESTURE_CONFIG, HammerGestureConfig, HammerModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {PhotoListComponent} from './components/photo-list/photo-list.component';
import {ConfigService} from './services/config.service';
import {PhotoService} from './services/photo.service';
import {PhotoResultSetService} from './services/photo-result-set.service';
import {PhotosForDayComponent} from './components/photos-for-day/photos-for-day.component';
import {PhotoThumbComponent} from './components/photo-thumb/photo-thumb.component';
import {IndividualPhotoComponent} from './components/individiual-photo/individual-photo-component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {IndividualPhotoInfoComponent} from './components/individiual-photo/individual-photo-info.component';
import {SearchComponent} from './components/search/search.component';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatInputModule} from '@angular/material/input';
import {MatNativeDateModule} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatSliderModule} from '@angular/material/slider';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {TagComponent} from './components/tag/tag-component';
import {TagService} from './services/tag.service';
import {DefaultUserComponent} from './components/default-user/default-user.component';
import {MatChipsModule} from '@angular/material/chips';
import {PhotoZoomControl} from './components/individiual-photo/zoom-control.component';
import {LoginIndicatorComponent} from './components/login-indicator/login-indicator.component';
import {UserService} from './services/user.service';
import {LoginDialogComponent} from './components/login-dialog/login-dialog-component';
import {SelectionService} from './services/selection.service';
import {PhotoSelectionToggle} from './components/photo-selection-toggle/photo-selection-toggle';


@Injectable()
export class MyHammerConfig extends HammerGestureConfig {
  overrides = <any> {
    swipe: {direction: Hammer.DIRECTION_HORIZONTAL},
  };
}

@NgModule({
  declarations: [
    AppComponent,
    DefaultUserComponent,
    IndividualPhotoComponent,
    IndividualPhotoInfoComponent,
    LoginDialogComponent,
    LoginIndicatorComponent,
    PhotoListComponent,
    PhotosForDayComponent,
    PhotoSelectionToggle,
    PhotoThumbComponent,
    PhotoZoomControl,
    SearchComponent,
    TagComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FontAwesomeModule,
    HammerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatInputModule,
    MatTooltipModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatSliderModule,
  ],
  providers: [
    ConfigService,
    PhotoService,
    PhotoResultSetService,
    SelectionService,
    TagService,
    UserService,
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: MyHammerConfig
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
