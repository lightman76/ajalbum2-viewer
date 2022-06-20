import {Component, EventEmitter, Input, Output} from '@angular/core';
import {faEdit} from '@fortawesome/pro-solid-svg-icons';
import {UserService} from '../../services/user.service';
import {UserInfo} from '../../services/helper/user-info';
import {MatDialog} from '@angular/material/dialog';
import {SelectionService} from '../../services/selection.service';
import {BulkPhotoEditDialogComponent} from '../bulk-photo-edit-dialog/bulk-photo-edit-dialog.component';

@Component({
  selector: 'edit-photo-button',
  template: `
    <div class="edit-photo-button"
         *ngIf="currentUser && (usageContext === 'single' || usageContext === 'multi' && selectionCount > 0)"
         (click)="editPhoto($event)"
         tabindex="0">
      <fa-icon
        [matTooltip]="'Edit '+selectionCount+' photo details.'"
        [matTooltipPosition]="'below'"
        [icon]="faEdit"
        [size]="'2x'"></fa-icon>
    </div>
  `,
  styles: [`
    .edit-photo-button {
      box-sizing: border-box;
      width: 50px;
      height: 50px;
      padding: 20px 10px 10px 10px;
      color: #3f51b5;
      display: inline-block;
    }

  `],
})
export class EditPhotoButtonComponent {
  faEdit = faEdit;
  @Input() public usageContext: string = 'multi';
  @Input() public viewingUser: string = null;
  @Output() public photosUpdated: EventEmitter<Array<number>>;
  currentUser: UserInfo = null;
  selectionCount: number = 0;

  constructor(private userService: UserService,
              private selectionService: SelectionService,
              private dialog: MatDialog) {
    this.photosUpdated = new EventEmitter<Array<number>>();
  }

  ngOnInit() {
    this.userService.getCurrentUser$().subscribe((currentUser) => {
      this.currentUser = currentUser;
    });
    this.selectionService.getSelectedPhotosById$().subscribe((curIds: { [id: string]: number }) => {
      this.selectionCount = curIds && Object.keys(curIds).length || 0;
      console.log('Got updated current IDs: ', curIds);
    });
  }

  editPhoto(evt) {
    evt.preventDefault();
    console.log('Got edit photo click', this.usageContext, this.selectionCount, this.currentUser);
    if (this.currentUser && (this.usageContext === 'multi' && this.selectionCount > 0 || this.usageContext === 'single')) {
      let updatePhotoIds = Object.keys(this.selectionService.getSelectedPhotosById$().getValue()).map((k) => {
        return parseInt(k);
      });
      console.log('Got edit photo click - opening dialog');
      const dialogRef = this.dialog.open(BulkPhotoEditDialogComponent, {
        width: '450px',
        data: {
          forUserName: this.viewingUser,
          photoIds: updatePhotoIds
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        console.log('Edit Photo dialog was closed', result);
        if (result && result.disposition === 'updated') {
          this.photosUpdated.emit(updatePhotoIds);
          console.log('  Emitting update for', updatePhotoIds);
        }
      });
    }
  }


}
