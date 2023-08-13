import {Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {UserService} from '../../services/user.service';
import {UserInfo} from '../../services/helper/user-info';
import {Photo} from '../../helper/photo';
import {ITag} from '../../services/helper/i-tag';
import {PhotoService, PhotoUpdateFields} from '../../services/photo.service';
import {UntypedFormBuilder, UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {PhotoResultSetService} from '../../services/photo-result-set.service';
import {TagService} from '../../services/tag.service';
import {BehaviorSubject, Observable} from 'rxjs';
import {TagActionEvent, TagActionInfo} from '../tag/tag-component';
import {faCheckSquare, faMinusSquare, faTimesSquare} from '@fortawesome/pro-regular-svg-icons';
import {AJHelpers} from '../../services/helper/ajhelpers';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {map, startWith} from 'rxjs/operators';
import {CreateTagDialogComponent} from '../create-tag-dialog/create-tag-dialog.component';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatChipInputEvent} from '@angular/material/chips';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';

@Component({
  selector: 'bulk-photo-edit-dialog',
  template: `
    <form (submit)="onSubmit($event)">
      <h2 mat-dialog-title>Edit Details {{!singlePhotoEdit ? ("(" + photoIds.length + " photos)") : ''}}</h2>
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
        <br/>
        <mat-form-field appearance="fill">
          <mat-label>Description</mat-label>
          <textarea
            placeholder="Description for photo(s)"
            #descriptionInput
            formControlName="description"
            matInput></textarea>
        </mat-form-field>
        <div class="photo-priority">
          <label id="photo-priority" class="photo-priority-label">Priority</label>
        </div>
        <mat-slider step="1" max="10" min="0" discrete showTickMarks>
          <input
            matSliderThumb
            class="example-margin"
            [value]="priority"
            (valueChange)="onPriorityChange($event)"
            aria-labelledby="photo-priority">
        </mat-slider>
        <div class="photo-orientation">
          <label id="photo-photo-orientation" class="photo-orientation-label">Orientation (relative to original)</label>
        </div>

        <mat-radio-group name="rotation-change"
                         #rotationInput
                         formControlName="rotation"
        >
          <mat-radio-button [value]="null">No change</mat-radio-button>
          <mat-radio-button value="0">Original</mat-radio-button>
          <mat-radio-button value="90">90 Clockwise</mat-radio-button>
          <mat-radio-button value="180">180</mat-radio-button>
          <mat-radio-button value="270">90 Counter-clockwise</mat-radio-button>
        </mat-radio-group>


        <div class="tag-edit-area" *ngIf="singlePhotoEdit">
          <mat-form-field appearance="fill">
            <mat-label>Tags:</mat-label>
            <mat-chip-grid #tagChipGrid aria-label="Search tags">
              <mat-chip-row *ngFor="let tagDetail of addTags"
                            [editable]="false"
                            (removed)="removeTag($event, tagDetail)">
                <tag [tagSubject]="tagDetail.tag$"
                     [tagActions]="[tagActionRemoveFromAll]"
                     (tagActionHandler)="onTagAction($event, addTags, tagDetail)"
                ></tag>
              </mat-chip-row>
              <input
                placeholder="Search tags"
                #searchTagInput
                [formControl]="searchTags"
                [matAutocomplete]="auto"
                [matChipInputFor]="tagChipGrid"
                [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                (matChipInputTokenEnd)="confirmAddTag($event)">
            </mat-chip-grid>
            <mat-autocomplete #auto="matAutocomplete" (optionSelected)="addSelectedTag($event)">
              <mat-option *ngFor="let tagSearchTerm of filterTags | async" [value]="tagSearchTerm">
                <fa-icon [icon]="getIconForType(tagSearchTerm)"></fa-icon>&nbsp;
                {{tagSearchTerm.name}}
              </mat-option>
            </mat-autocomplete>
          </mat-form-field>

        </div>

        <div class="tag-edit-area" *ngIf="!singlePhotoEdit">
          <div class="tag-edit-area__title">Tags:</div>
          <mat-form-field appearance="fill">
            <mat-label>Add to all:</mat-label>
            <mat-chip-grid #tagChipGrid aria-label="Search tags">
              <mat-chip-row *ngFor="let tagDetail of addTags"
                            [editable]="false"
                            (removed)="removeTag($event, tagDetail)">
                <tag [tagSubject]="tagDetail.tag$"
                     [tagActions]="tagDetail.originallyOnSome ? [tagActionLeaveUnchanged,tagActionRemoveFromAll] : [tagActionRemoveFromAll]"
                     (tagActionHandler)="onTagAction($event, addTags, tagDetail)"
                ></tag>
              </mat-chip-row>
              <input
                placeholder="Search tags"
                #searchTagInput
                [formControl]="searchTags"
                [matAutocomplete]="auto"
                [matChipInputFor]="tagChipGrid"
                [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                (matChipInputTokenEnd)="confirmAddTag($event)">
            </mat-chip-grid>
            <mat-autocomplete #auto="matAutocomplete" (optionSelected)="addSelectedTag($event)">
              <mat-option *ngFor="let tagSearchTerm of filterTags | async" [value]="tagSearchTerm">
                <fa-icon [icon]="getIconForType(tagSearchTerm)"></fa-icon>&nbsp;
                {{tagSearchTerm.name}}
              </mat-option>
            </mat-autocomplete>
          </mat-form-field>


          <div class="tag-list tag-list-added-some" *ngIf="!singlePhotoEdit">
            <div class="tag-list-title">Leave as originally (tag on some photos)</div>
            <span class="photo-tag" *ngFor="let tagDetail of someTags">
              <tag [tagSubject]="tagDetail.tag$"
                   [tagActions]="[tagActionAddToAll, tagActionRemoveFromAll]"
                   (tagActionHandler)="onTagAction($event, someTags, tagDetail)"
              ></tag>
            </span>
          </div>
          <div class="tag-list tag-list-removed">
            <div class="tag-list-title">Remove from all:</div>
            <span class="photo-tag" *ngFor="let tagDetail of removeTags">
              <tag [tagSubject]="tagDetail.tag$"
                   [tagActions]="tagDetail.originallyOnSome  ?  [tagActionLeaveUnchanged, tagActionAddToAll] : [tagActionAddToAll]"
                   (tagActionHandler)="onTagAction($event, removeTags, tagDetail)"
              ></tag>
            </span>
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
    .tag-list {
      margin-bottom: 15px;
    }

    .tag-list-title {
      font-weight: bold;
    }
  `],
})
export class BulkPhotoEditDialogComponent {
  title: string = null;
  description: string = null;
  priority: number = null;
  rotation: number = null;

  currentUser: UserInfo = null;
  forUserName: string = null;

  form: UntypedFormGroup;

  photos: Array<Photo>;
  addTags: Array<BulkTagDetail>;
  removeTags: Array<BulkTagDetail>;
  someTags: Array<BulkTagDetail>;

  photoIds: Array<number>;
  singlePhotoEdit: boolean = false;

  tagActionRemoveFromAll = new TagActionInfo('removeAll', 'Remove from all photos', faTimesSquare);
  tagActionLeaveUnchanged = new TagActionInfo('unchanged', 'Don\'t add or remove from any photos', faMinusSquare);
  tagActionAddToAll = new TagActionInfo('addAll', 'Add to all photos', faCheckSquare);
  separatorKeysCodes: number[] = [ENTER, COMMA];

  searchTags;
  filterTags: Observable<Array<ITag>>;
  allTags: Array<ITag>;


  /*
    @ViewChild('titleInput') titleInput: ElementRef<HTMLInputElement>;
    @ViewChild('descriptionInput') descriptionInput: ElementRef<HTMLTextAreaElement>;
    @ViewChild('rotationInput') rotationInput: ElementRef<HTMLInputElement>;
  */
  @ViewChild('searchTagInput') searchTagInput: ElementRef<HTMLInputElement>;

  /** data parameter
   * photoIds
   * forUserName
   *
   */

  constructor(public dialogRef: MatDialogRef<BulkPhotoEditDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private userService: UserService,
              private photoService: PhotoService,
              private photoResultSetService: PhotoResultSetService,
              private matSnackBar: MatSnackBar,
              private tagService: TagService,
              private dialog: MatDialog,
              private fb: UntypedFormBuilder,) {
    this.photos = [];
    this.addTags = [];
    this.someTags = [];
    this.removeTags = [];
    this.searchTags = new UntypedFormControl();
    this.allTags = [];
    this.filterTags = this.searchTags.valueChanges.pipe(
      startWith(null),
      map((name: string | null) => (name ? this._filter(name) : this.allTags.slice())),
    );

  }

  ngOnInit() {
    this.form = this.fb.group({
      title: [this.title, []],
      description: [this.description, []],
      priority: [this.priority, []],
      rotation: [this.rotation, []],
    });
    this.forUserName = this.data.forUserName;
    this.photoIds = this.data.photoIds;

    this.singlePhotoEdit = this.photoIds.length === 1;

    this.tagService.getAllTags(this.forUserName).then((tags) => {
      this.allTags = tags.map((t) => t.getValue());
    }, (err) => {
      console.error('Failure retrieving tags: ', err);
    });


    this.userService.getCurrentUser$().subscribe((currentUser) => {
      this.currentUser = currentUser;
    });

    this.form.get('title').valueChanges.subscribe((val) => {
      this.title = val;
    });
    this.form.get('description').valueChanges.subscribe((val) => {
      this.description = val;
    });
    this.form.get('priority').valueChanges.subscribe((val) => {
      this.priority = val;
    });
    this.refreshPhotoTags();

    this.form.get('rotation').valueChanges.subscribe((val) => {
      this.rotation = val;
    });

  }

  async refreshPhotoTags() {
    let tag$sById = {};
    let tags = await this.tagService.getAllTags(this.forUserName);
    tags.forEach((t$) => {
      tag$sById[t$.getValue().id] = t$;
    });

    if (this.singlePhotoEdit) {
      let photo = await this.photoResultSetService.getPhotoForId(this.forUserName, this.photoIds[0]);
      this.photos.push(photo);
      this.form.setValue({title: photo.title, description: photo.description, priority: photo.feature_threshold, rotation: null});
      this.priority = photo.feature_threshold;
      photo.tags.forEach((tid) => {
        let t$ = tag$sById[tid];
        if (t$) {
          this.addTags.push(new BulkTagDetail(t$, true, true));
        }
      });
    } else if (this.photoIds.length > 0) {
      let tagPhotoCountById = {};
      await Promise.all(this.photoIds.map(async (photoId) => {
        let photo = await this.photoResultSetService.getPhotoForId(this.forUserName, photoId);
        this.photos.push(photo);
        photo.tags.forEach((tid) => {
          let t$ = tag$sById[tid];
          if (t$) {
            tagPhotoCountById[tid] = (tagPhotoCountById[tid] || 0) + 1;
          }
        });
      }));
      console.log('multi photo edit: tag counts: ', tagPhotoCountById);
      let len = this.photoIds.length;
      Object.keys(tagPhotoCountById).forEach((tid) => {
        let t$ = tag$sById[tid];
        if (tagPhotoCountById[tid] === len) {
          this.someTags.push(new BulkTagDetail(t$, true, true));
        } else {
          this.someTags.push(new BulkTagDetail(t$, false, true));
        }
      });
    }
  }

  onTagAction(tagActionEvent: TagActionEvent, tagList: Array<BulkTagDetail>, tagDetail: BulkTagDetail) {
    let idx = tagList.findIndex((ti) => {
      return ti.tag$.getValue() === tagActionEvent.tag;
    });
    let btd = tagList.splice(idx, 1)[0];
    if (tagActionEvent.tagAction.actionEventName === 'addAll') {
      this.addTags.push(btd);
    } else if (tagActionEvent.tagAction.actionEventName === 'removeAll') {
      if (tagDetail.originallyOnSome) {
        this.removeTags.push(btd);
      } //If not on any tags, drop it - no need to show it in the remove.
    } else if (tagActionEvent.tagAction.actionEventName === 'unchanged') {
      this.someTags.push(btd);
    }
  }

  removeTag($event, tagDetail) {
    //Dispatch the autocompleter removeTag event through our normal tag handling
    let evt = new TagActionEvent(tagDetail.tag$.getValue(), this.tagActionRemoveFromAll);
    this.onTagAction(evt, this.addTags, tagDetail);
    this.searchTagInput.nativeElement.value = '';
    this.searchTags.setValue('');
  }

  addSelectedTag(evt: MatAutocompleteSelectedEvent) {
    let tag = <ITag> <any> evt.option.value;

    //Now look to see if this tag exists already in the add list - if so ignore
    let addIdx = this.addTags.findIndex((td) => {
      return td.tag$.getValue().id === tag.id;
    });
    if (addIdx >= 0) {
      return;
    }
    //Now look to see if this tag exists already in the some or remove list - if so, dispatch in normal tag handling
    let someIdx = this.someTags.findIndex((td) => {
      return td.tag$.getValue().id === tag.id;
    });
    let removeIdx = this.removeTags.findIndex((td) => {
      return td.tag$.getValue().id === tag.id;
    });
    let existingTagDetail = null;
    if (someIdx >= 0) {
      existingTagDetail = this.someTags[someIdx];
    }
    if (removeIdx >= 0) {
      existingTagDetail = this.removeTags[removeIdx];
    }
    if (existingTagDetail) {
      let tagEvt = new TagActionEvent(tag, this.tagActionAddToAll);
      this.onTagAction(tagEvt, this.addTags, existingTagDetail);
    } else {
      let tag$ = this.tagService.getTag$forIds([tag.id])[tag.id];
      this.addTags.push(new BulkTagDetail(tag$, false, false));
    }
    this.searchTagInput.nativeElement.value = '';
    this.searchTags.setValue('');
  }

  confirmAddTag(evt: MatChipInputEvent) {
    let tagName = evt.value;
    this.searchTagInput.nativeElement.value = '';
    this.searchTags.setValue('');
    //TODO:

    const dialogRef = this.dialog.open(CreateTagDialogComponent, {
      width: '350px',
      data: {
        forUserName: this.forUserName,
        currentUser: this.currentUser,
        name: tagName
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('Create tag dialog was closed', result);
      if (result && result.disposition === 'created') {
        //Ok - add the new tag to the list
        let tag$ = result.tag$;
        this.addTags.push(new BulkTagDetail(tag$, false, false));
      }
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
    if (this.rotation !== null) {
      updatedParams.forced_rotation = this.rotation;
    }
    if (this.addTags.length > 0) {
      updatedParams.add_tags = this.addTags.map((btd) => btd.tag$.getValue().id);
    }
    if (this.removeTags.length > 0) {
      updatedParams.remove_tags = this.removeTags.map((btd) => btd.tag$.getValue().id);
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
  }

  onPriorityChange(val) {
    //console.log("OnPriorityChange: got value "+evt.value,evt)
    this.priority = val || 0;
  }

  getIconForType(tag: ITag) {
    return AJHelpers.getIconForType(tag);
  }

  private _filter(value: string | ITag): ITag[] {
    if (!value) {
      return this.allTags;
    }

    const filterValue = (<any> value).name ? (<ITag> value).name.toLowerCase() : (<string> value).toLowerCase();

    return this.allTags.filter(tag => tag.name ? tag.name.toLowerCase().includes(filterValue) : false);
  }


}

export class BulkTagDetail {
  tag$: BehaviorSubject<ITag>;
  originallyOnAll: boolean = false;
  originallyOnSome: boolean = false;

  constructor(tag$, originallyOnAll = false, originallyOnSome: boolean = false) {
    this.tag$ = tag$;
    this.originallyOnAll = originallyOnAll;
    this.originallyOnSome = originallyOnSome;
  }
}
