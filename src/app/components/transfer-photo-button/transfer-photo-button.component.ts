import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import {faTransporter2} from '@fortawesome/pro-solid-svg-icons';
import {UserService} from '../../services/user.service';
import {UserInfo} from '../../services/helper/user-info';
import {SelectionService} from '../../services/selection.service';
import {PhotoService} from '../../services/photo.service';
import {SignedInUsersInfo} from '../../services/helper/signed-in-users-info';

@Component({
  selector: 'transfer-photo-button',
  template: `
    <div class="transfer-photo-button"
         *ngIf="currentUser && (usageContext === 'single' || usageContext === 'multi' && selectionCount > 0)"
         (click)="transferPhoto($event)"
         tabindex="0">
      <fa-icon
        [matTooltip]="usageContext === 'multi' ? 'Transfer '+selectionCount+' photos to another account.':'Transfer this photo to another account'"
        [matTooltipPosition]="'below'"
        [icon]="faTransporter2"
        [size]="'2x'"></fa-icon>
    </div>
    <dialog #transferDialog class="transfer-dialog">
      <form method="dialog" *ngIf="otherUsersList.length > 0">
        <h2>Transfer photo{{selectionCount > 1 ? 's' : ''}} to another account</h2>
        <p>
          <label for="toUser">To account</label>
          <select name="toAccount" class="transfer-photo-button__to-account-selector">
            <option></option>
            <option *ngFor="let acct of otherUsersList"
                    [value]="acct.userName"
            >{{acct.userName}}</option>
          </select>
        </p>
        <p>
          <button class="btn btn-primary" (click)="doTransfer($event)">Transfer</button>&nbsp;&nbsp;
          <button class="btn btn-link" (click)="cancelTransfer($event)">Cancel</button>
        </p>
      </form>
      <div *ngIf="otherUsersList.length === 0">
        <p>
          <i>You need to navigate to the other user account and sign in. Then you can transfer photos to that account.</i>
        </p>
        <p>
          <button class="btn btn-link" (click)="cancelTransfer($event)">Cancel</button>
        </p>
      </div>
    </dialog>
  `,
  styles: [`
    .transfer-photo-button {
      box-sizing: border-box;
      width: 50px;
      height: 50px;
      padding: 20px 10px 10px 10px;
      color: #3f51b5;
      display: inline-block;
    }

  `],
  changeDetection: ChangeDetectionStrategy.Default
})
export class TransferPhotoButtonComponent {
  faTransporter2 = faTransporter2;
  @Input() public usageContext: string = 'multi';
  @Input() public photoTimeId: number = null;
  @Input() public viewingUser: string = null;
  @Output() public afterTransfer: EventEmitter<Array<number>>;
  @ViewChild('transferDialog', {static: true}) dialogEl: ElementRef<HTMLDialogElement>;
  cdr = inject(ChangeDetectorRef);

  currentUsers: SignedInUsersInfo = null;
  otherUsersList: Array<UserInfo> = null;
  currentUser: UserInfo = null;
  selectionCount: number = 0;

  constructor(private userService: UserService,
              private selectionService: SelectionService,
              private photoService: PhotoService) {
    this.afterTransfer = new EventEmitter<Array<number>>();
  }

  ngOnInit() {
    this.userService.getCurrentUsers$().subscribe((currentUsers) => {
      this.currentUsers = currentUsers;
      this.currentUser = this.currentUsers.userInfosByName[this.viewingUser];
      this.otherUsersList = [];
      Object.keys(this.currentUsers.userInfosByName).sort().forEach((name) => {
        if (name !== this.viewingUser) {
          this.otherUsersList.push(this.currentUsers.userInfosByName[name]);
        }
      });
      console.log('  Transfer button - Got users ', currentUsers);
      console.log('  Transfer button - Got other users as ', this.otherUsersList);
    });
    this.selectionService.getSelectedPhotosById$().subscribe((curIds: { [id: string]: number }) => {
      this.selectionCount = curIds && Object.keys(curIds).length || 0;
      console.log('Got updated current IDs: ', curIds);
    });
  }

  transferPhoto(evt) {
    evt.preventDefault();
    console.log('Got transfer photo click', this.usageContext, this.selectionCount, this.currentUser);
    if (this.currentUser && (this.usageContext === 'multi' && this.selectionCount > 0 || this.usageContext === 'single')) {
      console.log('Got transfer photo click - opening user list to transfer photos');
      this.cdr.detectChanges();
      this.dialogEl.nativeElement.showModal();


      /*
            if (confirm('Are you sure you want to delete these ' + deletePhotoIds.length + ' photos?')) {
              this.photoService.deletePhotos(
                this.currentUser.authenticationToken,
                this.currentUser.userName,
                deletePhotoIds).subscribe(() => {
                //TODO: then call afterDelete
                this.afterTransfer.emit(deletePhotoIds);
              }, () => {
                console.error('FAILURE: failed while deleting photos! ', deletePhotoIds);
              });
            }
      */
    }
  }

  doTransfer(evt) {
    let toUser = (<HTMLSelectElement> document.getElementsByClassName('transfer-photo-button__to-account-selector')[0]).value;
    if (!toUser || toUser === this.viewingUser) {
      //TODO: should probably show an error message
      return;
    }
    let toUserInfo = this.currentUsers.userInfosByName[toUser];
    if (!toUserInfo) {
      //Again - should probably show an error message
      return;
    }

    let transferPhotoIds = [];
    if (this.usageContext === 'multi') {
      transferPhotoIds = Object.keys(this.selectionService.getSelectedPhotosById$().getValue()).map((k) => {
        return parseInt(k);
      });
    } else {
      transferPhotoIds = [this.photoTimeId];
    }
    if (transferPhotoIds.length === 0) {
      //again - should probably show an error.
      return;
    }
    console.log('  transfer photos to ' + toUser + ' - initiating transfer photos', transferPhotoIds);
    this.photoService.transferPhotos(this.currentUser.authenticationToken, this.currentUser.userName, toUserInfo.userName, toUserInfo.authenticationToken, transferPhotoIds).subscribe((result) => {
      console.log(' Transfer completed: transferred ' + result.transfer_count);
      this.dialogEl.nativeElement.close();

      this.afterTransfer.emit(transferPhotoIds);
      this.cdr.detectChanges();
    });
  }

  cancelTransfer(evt) {
    this.dialogEl.nativeElement.close();
    this.cdr.detectChanges();
  }


}
