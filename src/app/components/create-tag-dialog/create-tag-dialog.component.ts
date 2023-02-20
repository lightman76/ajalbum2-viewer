import {Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {UserService} from '../../services/user.service';
import {UserInfo} from '../../services/helper/user-info';
import {UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';
import {TagService} from '../../services/tag.service';
import {AJHelpers} from '../../services/helper/ajhelpers';
import {MatLegacyRadioChange as MatRadioChange} from '@angular/material/legacy-radio';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'create-tag-dialog',
  template: `
    <form (submit)="onSubmit($event)">
      <h2 mat-dialog-title>Create new tag</h2>
      <mat-dialog-content [formGroup]="form">
        <mat-form-field appearance="fill">
          <mat-label>Name</mat-label>
          <input
            placeholder="Name for the tag"
            type="text"
            #nameInput
            formControlName="name"
            matInput>
        </mat-form-field>
        <br/>

        <mat-radio-group
          [name]="tagType"
          (change)="onTagTypeChange($event)">

          <mat-radio-button
            [checked]="tagType === 'tag'"
            [value]="'tag'">
            <fa-icon [icon]="getIconForTagType('tag')"></fa-icon>
            Tag
          </mat-radio-button>

          <mat-radio-button
            [checked]="tagType === 'album'"
            [value]="'album'">
            <fa-icon [icon]="getIconForTagType('album')"></fa-icon>
            Album
          </mat-radio-button>

          <mat-radio-button
            [checked]="tagType === 'event'"
            [value]="'event'">
            <fa-icon [icon]="getIconForTagType('event')"></fa-icon>
            Event
          </mat-radio-button>

          <mat-radio-button
            [checked]="tagType === 'location'"
            [value]="'location'">
            <fa-icon [icon]="getIconForTagType('location')"></fa-icon>
            Location
          </mat-radio-button>

          <mat-radio-button
            [checked]="tagType === 'people'"
            [value]="'people'">
            <fa-icon [icon]="getIconForTagType('people')"></fa-icon>
            Person
          </mat-radio-button>
          <mat-radio-button
            [checked]="tagType === 'species'"
            [value]="'species'">
            <fa-icon [icon]="getIconForTagType('species')"></fa-icon>
            Species
          </mat-radio-button>


        </mat-radio-group>
        <br/>
        <mat-form-field appearance="fill">
          <mat-label>URL name</mat-label>
          <input
            placeholder="URL friendly name"
            type="text"
            #urlNameInput
            formControlName="shortcutUrl"
            matInput>
        </mat-form-field>


        <br/>
        <mat-form-field appearance="fill">
          <mat-label>Description</mat-label>
          <textarea
            placeholder="Description for tag"
            #descriptionInput
            formControlName="description"
            matInput></textarea>
        </mat-form-field>


        <mat-dialog-actions>
          <div class="mdc-touch-target-wrapper">
            <button mat-button class="mdc-button mdc-button--touch" type="submit">
              <span class="mdc-button__ripple"></span>
              <span class="mdc-button__touch"></span>
              <span class="mdc-button__label">Create</span>
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
    mat-radio-button {
      display: block;
    }
  `],
})
export class CreateTagDialogComponent {
  userName: string = null;
  name: string = null;
  tagType: string = null;

  locationLatitude: number = null;
  locationLongitude: number = null;
  eventDate: Date = null;
  shortcutUrl: string = null;
  description: string = null;

  form: UntypedFormGroup;
  currentUser: UserInfo = null;

  @ViewChild('nameInput') nameInput: ElementRef<HTMLInputElement>;
  @ViewChild('descriptionInput') descriptionInput: ElementRef<HTMLTextAreaElement>;
  @ViewChild('urlNameInput') urlNameInput: ElementRef<HTMLInputElement>;

  /** data parameter
   * name
   * forUserName
   *
   */

  constructor(public dialogRef: MatDialogRef<CreateTagDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private userService: UserService,
              private matSnackBar: MatSnackBar,
              private tagService: TagService,
              private fb: UntypedFormBuilder,) {
  }

  ngOnInit() {
    this.userName = this.data.forUserName;
    this.name = this.data.name;
    this.currentUser = this.data.currentUser;

    this.form = this.fb.group({
      name: [this.name, []],
      tagType: [this.tagType, []],
      description: [this.description, []],
      locationLatitude: [this.locationLatitude, []],
      locationLongitude: [this.locationLongitude, []],
      eventDate: [this.eventDate, []],
      shortcutUrl: [this.shortcutUrl, []],
    });

    this.form.get('name').valueChanges.subscribe((val) => {
      this.name = val;
    });
    this.form.get('description').valueChanges.subscribe((val) => {
      this.description = val;
    });
    this.form.get('locationLatitude').valueChanges.subscribe((val) => {
      this.locationLatitude = val;
    });
    this.form.get('locationLongitude').valueChanges.subscribe((val) => {
      this.locationLongitude = val;
    });
    this.form.get('eventDate').valueChanges.subscribe((val) => {
      this.eventDate = val;
    });
    this.form.get('shortcutUrl').valueChanges.subscribe((val) => {
      this.shortcutUrl = val;
    });
  }

  onTagTypeChange(evt: MatRadioChange) {
    this.tagType = evt.value;
  }


  async onSubmit(evt) {
    if (evt) {
      evt.preventDefault();
    }
    //First - make sure this doesn't conflict with existing tags (client side at least, server side will still have to check)
    let allTags = await this.tagService.getAllTags(this.userName);
    let match$ = allTags.find((tag$) => {
      let tag = tag$.getValue();
      if (tag.name.toLowerCase() === this.name.toLowerCase() && tag.tag_type === this.tagType) {
        return tag$;
      }
    });
    if (match$) {
      this.dialogRef.close({disposition: 'created', tag$: match$});
      return;
    }
    //Ok - no match found, create the tag
    let optionsHash = {};
    if (this.tagType === 'location') {
      optionsHash['location_latitude'] = this.locationLatitude;
      optionsHash['location_longitude'] = this.locationLongitude;
    } else if (this.tagType === 'event') {
      optionsHash['event_date'] = this.eventDate;
    }
    try {
      let tag$ = await this.tagService.createTag(this.userName, this.currentUser.authenticationToken, this.tagType, this.name, this.description, this.shortcutUrl, optionsHash);
      this.dialogRef.close({disposition: 'created', tag$: tag$});
    } catch (e) {
      this.matSnackBar.open('Failed to create tag', 'Dismiss', {
        duration: 5000
      });

    }
  }

  getIconForTagType(tagType: string) {
    return AJHelpers.getIconForTagType(tagType);
  }
}
