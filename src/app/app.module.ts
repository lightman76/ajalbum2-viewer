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
import {MatLegacyAutocompleteModule as MatAutocompleteModule} from '@angular/material/legacy-autocomplete';
import {MatLegacyTooltipModule as MatTooltipModule} from '@angular/material/legacy-tooltip';
import {MatLegacyInputModule as MatInputModule} from '@angular/material/legacy-input';
import {MatNativeDateModule} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatLegacySliderModule as MatSliderModule} from '@angular/material/legacy-slider';
import {ReactiveFormsModule} from '@angular/forms';
import {MatLegacyButtonModule as MatButtonModule} from '@angular/material/legacy-button';
import {MatLegacyRadioModule as MatRadioModule} from '@angular/material/legacy-radio';
import {MatLegacySnackBarModule as MatSnackBarModule} from '@angular/material/legacy-snack-bar';
import {MatLegacyDialogModule as MatDialogModule} from '@angular/material/legacy-dialog';
import {TagComponent} from './components/tag/tag-component';
import {TagService} from './services/tag.service';
import {DefaultUserComponent} from './components/default-user/default-user.component';
import {MatLegacyChipsModule as MatChipsModule} from '@angular/material/legacy-chips';
import {PhotoZoomControl} from './components/individiual-photo/zoom-control.component';
import {LoginIndicatorComponent} from './components/login-indicator/login-indicator.component';
import {UserService} from './services/user.service';
import {LoginDialogComponent} from './components/login-dialog/login-dialog-component';
import {SelectionService} from './services/selection.service';
import {PhotoSelectionToggle} from './components/photo-selection-toggle/photo-selection-toggle';
import {EditPhotoButtonComponent} from './components/edit-photo-button/edit-photo-button.component';
import {BulkPhotoEditDialogComponent} from './components/bulk-photo-edit-dialog/bulk-photo-edit-dialog.component';
import {CreateTagDialogComponent} from './components/create-tag-dialog/create-tag-dialog.component';
import {APP_BASE_HREF} from '@angular/common';


@Injectable()
export class MyHammerConfig extends HammerGestureConfig {
  overrides = <any> {
    swipe: {direction: Hammer.DIRECTION_HORIZONTAL},
  };
}

@NgModule({
  declarations: [
    AppComponent,
    BulkPhotoEditDialogComponent,
    CreateTagDialogComponent,
    DefaultUserComponent,
    EditPhotoButtonComponent,
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
    MatAutocompleteModule,
    MatChipsModule,
    MatDialogModule,
    MatInputModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatButtonModule,
    MatRadioModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatSliderModule,
    ReactiveFormsModule,
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
    },
    {
      provide: APP_BASE_HREF,
      useValue: '/photos/'
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
