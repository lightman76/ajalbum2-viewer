import {Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {UserService} from '../../services/user.service';
import {UserInfo} from '../../services/helper/user-info';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Photo} from '../../helper/photo';
import {ITag} from '../../services/helper/i-tag';
import {PhotoService, PhotoUpdateFields} from '../../services/photo.service';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';

@Component({
  selector: 'bulk-photo-edit-dialog',
  template: `
    <form (submit)="onSubmit($event)">
      <h2 mat-dialog-title>Edit Details</h2>
      <mat-dialog-content [formGroup]="form">
        <mat-form-field appearance="fill">
          <mat-label>Title</mat-label>
          <input
            placeholder="Title for photo(s)"
            type="text"
            #titleInput
            formControlName="title"
            matInput>
        </mat-form-field>
        <mat-form-field appearance="fill">
          <mat-label>Description</mat-label>
          <textarea
            placeholder="Description for photo(s)"
            #descriptionInput
            formControlName="description"
            matInput></textarea>
        </mat-form-field>
        <div class="tag-edit-area">
          <div class="tag-edit-area__title">Tags:</div>
          <div class="tag-list tag-list-added-all">
            <div class="tag-list-title">Added to all:</div>
            TODO
          </div>
          <div class="tag-list tag-list-added-some">
            <div class="tag-list-title">Exist on some but not all:</div>
            TODO
          </div>
          <div class="tag-list tag-list-removed">
            <div class="tag-list-title">Remove from all:</div>
            TODO
          </div>
        </div>
        <mat-dialog-actions>
          <div class="mdc-touch-target-wrapper">
            <button mat-button class="mdc-button mdc-button--touch" type="submit">
              <span class="mdc-button__ripple"></span>
              <span class="mdc-button__touch"></span>
              <span class="mdc-button__label">Update</span>
            </button>
          </div>
          <div class="mdc-touch-target-wrapper">
            <button mat-button class="mdc-button mdc-button--touch" type="button" (click)="dialogRef.close({disposition:'cancel'})">
              <span class="mdc-button__ripple"></span>
              <span class="mdc-button__touch"></span>
              <span class="mdc-button__label">Cancel</span>
            </button>
          </div>
        </mat-dialog-actions>
      </mat-dialog-content>
    </form>
  `,
  styles: [`
  `],
})
export class BulkPhotoEditDialogComponent {
  title: string = null;
  description: string = null;
  priority: number = null;

  currentUser: UserInfo = null;
  forUserName: string = null;

  form: FormGroup;

  titleForm: FormControl;
  descriptionForm: FormControl;
  priorityForm: FormControl;

  photos: Array<Photo>;
  addTags: Array<ITag>;
  removeTags: Array<ITag>;
  someTags: Array<ITag>;

  photoIds: Array<number>;

  @ViewChild('titleInput') titleInput: ElementRef<HTMLInputElement>;
  @ViewChild('descriptionInput') descriptionInput: ElementRef<HTMLTextAreaElement>;

  /** data parameter
   * photoIds
   * forUserName
   *
   */

  constructor(public dialogRef: MatDialogRef<BulkPhotoEditDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private userService: UserService,
              private photoService: PhotoService,
              private matSnackBar: MatSnackBar,
              private fb: FormBuilder,) {
  }

  ngOnInit() {
    this.form = this.fb.group({
      title: [this.title, []],
      description: [this.description, []],
    });
    this.forUserName = this.data.forUserName;
    this.photoIds = this.data.photoIds;

    this.userService.getCurrentUser$().subscribe((currentUser) => {
      this.currentUser = currentUser;
    });

    this.form.get('title').valueChanges.subscribe((val) => {
      this.title = val;
    });
    this.form.get('description').valueChanges.subscribe((val) => {
      this.description = val;
    });

  }

  onSubmit(evt) {
    if (evt) {
      evt.preventDefault();
    }

    let updatedParams = new PhotoUpdateFields();
    updatedParams.photo_time_ids = this.photoIds;
    if (this.title) {
      updatedParams.updated_title = this.title;
    }
    if (this.description) {
      updatedParams.updated_description = this.description;
    }
    if (this.priority !== null) {
      updatedParams.updated_feature_threshold = this.priority;
    }
    console.log('Prepared the following updates', updatedParams, this.currentUser);
    let promise = this.photoService.updatePhotos(this.currentUser.authenticationToken, this.forUserName, updatedParams);
    promise.subscribe((updatedPhotos) => {
      console.log('Successfully updated ', updatedPhotos);
      this.dialogRef.close({disposition: 'updated', updatedPhotos: updatedPhotos});
    }, (xhr: any) => {
      console.error('Failure while updating photos', xhr.response.body);
      this.matSnackBar.open('An error occurred while making updates.  ', 'Dismiss', {
        duration: 5000
      });
    });
    /*
        if (!username.value || !password.value) {
          this.matSnackBar.open('Please provide a username and password', 'Dismiss', {
            duration: 5000
          });
        }
        this.userService.loginUser(username.value, password.value).then((userInfo: UserInfo) => {
          this.matSnackBar.open('Successfully logged in', 'Dismiss', {
            duration: 2000
          });
          this.dialogRef.close({userInfo: userInfo});
        }, (reason: any) => {
          this.matSnackBar.open('Invalid username or password.', 'Dismiss', {
            duration: 5000
          });
        });
    */
  }

  onPriorityChange(evt) {
    this.priority = evt.value || 0;
  }
}
