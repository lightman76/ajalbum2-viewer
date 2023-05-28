import {Component, EventEmitter, Input, Output} from '@angular/core';
import {faTrash} from '@fortawesome/pro-solid-svg-icons';
import {UserService} from '../../services/user.service';
import {UserInfo} from '../../services/helper/user-info';
import {SelectionService} from '../../services/selection.service';
import {MatDialog} from '@angular/material/dialog';
import {PhotoService} from '../../services/photo.service';

@Component({
  selector: 'delete-photo-button',
  template: `
    <div class="delete-photo-button"
         *ngIf="currentUser && (usageContext === 'single' || usageContext === 'multi' && selectionCount > 0)"
         (click)="deletePhoto($event)"
         tabindex="0">
      <fa-icon
        [matTooltip]="'Delete '+selectionCount+' photos.'"
        [matTooltipPosition]="'below'"
        [icon]="faTrash"
        [size]="'2x'"></fa-icon>
    </div>
  `,
  styles: [`
    .delete-photo-button {
      box-sizing: border-box;
      width: 50px;
      height: 50px;
      padding: 20px 10px 10px 10px;
      color: #cb0101;
      display: inline-block;
    }

  `],
})
export class DeletePhotoButtonComponent {
  faTrash = faTrash;
  @Input() public usageContext: string = 'multi';
  @Input() public viewingUser: string = null;
  @Output() public afterDelete: EventEmitter<Array<number>>;
  currentUser: UserInfo = null;
  selectionCount: number = 0;

  constructor(private userService: UserService,
              private selectionService: SelectionService,
              private photoService: PhotoService,
              private dialog: MatDialog) {
    this.afterDelete = new EventEmitter<Array<number>>();
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

  deletePhoto(evt) {
    evt.preventDefault();
    console.log('Got delete photo click', this.usageContext, this.selectionCount, this.currentUser);
    if (this.currentUser && (this.usageContext === 'multi' && this.selectionCount > 0 || this.usageContext === 'single')) {
      let deletePhotoIds = Object.keys(this.selectionService.getSelectedPhotosById$().getValue()).map((k) => {
        return parseInt(k);
      });
      console.log('Got delete photo click - opening confirmation');
      if (confirm('Are you sure you want to delete these ' + deletePhotoIds.length + ' photos?')) {
        //TODO: call photo service to delete
        this.photoService.deletePhotos(
          this.userService.getCurrentUser$().getValue().authenticationToken,
          this.userService.getCurrentUser$().getValue().userName,
          deletePhotoIds).subscribe(() => {
          //TODO: then call afterDelete
          this.afterDelete.emit(deletePhotoIds);
        }, () => {
          console.error('FAILURE: failed while deleting photos! ', deletePhotoIds);
        });
      }
    }
  }


}
