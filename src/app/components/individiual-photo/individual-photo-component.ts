import {Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {PhotoService} from '../../services/photo.service';
import {SearchQuery} from '../../services/helper/search-query';
import {PhotoResultSetService} from '../../services/photo-result-set.service';
import {Photo} from '../../helper/photo';
import {
  faCheckCircle,
  faChevronCircleLeft,
  faChevronCircleRight,
  faCircle,
  faDownload,
  faEdit,
  faTimes,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import {UserService} from '../../services/user.service';
import {BulkPhotoEditDialogComponent} from '../bulk-photo-edit-dialog/bulk-photo-edit-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {UserInfo} from '../../services/helper/user-info';
import {SignedInUsersInfo} from '../../services/helper/signed-in-users-info';
import {SelectionService} from '../../services/selection.service';

@Component({
  selector: 'individual-photo',
  template: `
    <div class="individual-photo-container"
    >
      <div class="photo-selection-container"
           [class.individual-photo__selection-enabled]="isSelectionEnabled"
           [class.individual-photo__selected]="isSelected"
      >
        <span class="photo-selected__indicator" (click)="onSelectClick($event)">
          <fa-icon [icon]="faCheckCircle" [size]="'2x'" [matTooltip]="'Unselect this photo'"></fa-icon>
        </span>
        <span class="photo-unselected__indicator" (click)="onSelectClick($event)">
          <fa-icon [icon]="faCircle" [size]="'2x'" [matTooltip]="'Select this photo'"></fa-icon>
        </span>
      </div>
      <div class="return-to-search" (click)="returnToSearch($event)" [matTooltip]="'Return to search results'" tabindex="0">
        <fa-icon [icon]="faTimes"></fa-icon>
      </div>
      <div class="zoom-toggle">
        <photo-zoom-control [zoomLevel]="zoomLevel" (updatedZoomLevel)="onZoomLevelUpdate($event)"></photo-zoom-control>
      </div>
      <div class="individual-photo-controls">
        <div class="individual-photo-controls-body">
          <div class="transfer-btn" *ngIf="photo">
            <transfer-photo-button
              [usageContext]="'single'"
              [photoTimeId]="photo.time_id"
              [viewingUser]="userName"
              (afterTransfer)="futurePhoto($event)"
            ></transfer-photo-button>

          </div>
          <div class="download-btn" *ngIf="photo">
            <a target="_blank"
               [href]="'storage/'+photo.user_id+'/'+photo.image_versions['original'].root_store+'/'+(zoomLevel === 1.0 ? photo.image_versions['original'].relative_path: photo.image_versions['original'].relative_path)"
               [download]="photo.date_bucket+'_'+photo.title"
            >
              <fa-icon [icon]="faDownload"></fa-icon>
            </a>
          </div>
          <div class="edit-details" (click)="openEdit($event)" [matTooltip]="'Edit details'" tabindex="0" *ngIf="canEdit">
            <fa-icon [icon]="faEdit"></fa-icon>
          </div>
          <div class="delete-photo" (click)="confirmDelete($event)" [matTooltip]="'Delete photo'" tabindex="0" *ngIf="canEdit">
            <fa-icon [icon]="faTrash"></fa-icon>
          </div>
        </div>
      </div>
      <div class="navigation-button navigation-button-past" (click)="pastPhoto($event)" [matTooltip]="'Previous photo'"
           [matTooltipPosition]="'right'">
        <div class="navigation-button-icon" tabindex="0">
          <fa-icon [icon]="faChevronCircleLeft" [size]="'2x'"></fa-icon>
        </div>
      </div>
      <div class="navigation-button navigation-button-future" (click)="futurePhoto($event)" [matTooltip]="'Next Photo'"
           [matTooltipPosition]="'left'">
        <div class="navigation-button-icon" tabindex="0">
          <fa-icon [icon]="faChevronCircleRight" [size]="'2x'"></fa-icon>
        </div>
      </div>
      <div class="is_loading" *ngIf="!photoId && !photo">No photo id found...</div>
      <div class="is_loading" *ngIf="photoId && !photo">Loading...</div>
      <div [ngClass]="{'photo-normal':zoomLevel === 1.0, 'photo-zoomed':zoomLevel !== 1.0}"
           class="image-container"
           *ngIf="photoId && photo"
           #imgContainer
           (panstart)="onPanstart($event,imgContainer)"
           (panmove)="onPanMove($event)"
           (panend)="onPanEnd($event)"
           (pinchstart)="onPinchStart($event)"
           (pinchmove)="onPinchMove($event)"
           (pinchend)="onPinchEnd($event)"
           (swipe)="onSwipe($event)">
        <img *ngIf="photo.image_versions['screenHd']"
             #imgHost
             [attr.src]="'storage/'+photo.user_id+'/'+photo.image_versions['screenHd'].root_store+'/'+(zoomLevel === 1.0 ? photo.image_versions['screenHd'].relative_path: photo.image_versions['fullRes'].relative_path)"
             [attr.alt]="photo.title">
      </div>
      <individual-photo-info [photo]="photo" *ngIf="photo" [zoomLevel]="zoomLevel"></individual-photo-info>
    </div>
  `,
  host: {
    '(document:keydown.arrowleft)': 'keyPastPhoto($event)',
    '(document:keydown.arrowright)': 'keyFuturePhoto($event)',
    '(document:keydown.escape)': 'handleEscape($event)',
    '(document:keydown.add)': 'handleZoom($event)',
    '(document:keydown.shift.=)': 'handleZoom($event)',
    '(document:keydown.=)': 'handleZoom($event)',
    '(document:keydown.-)': 'handleUnzoom($event)',
  },

  styles: [`
    .individual-photo-container {
      position: relative;
      width: 100vw;
      height: 100vh;
    }

    .individual-photo-controls {
      position: fixed;
      top: 10px;
      right: 20px;
      height: 40px;
      z-index: 20;
    }

    .individual-photo-controls-body {
      height: 40px;
      padding: 5px 100px 5px 10px;
      border-radius: 7px;
      display: flex;
      gap: 7px;
      flex-direction: row-reverse;
      transition-property: opacity, background-color;
      transition-duration: 250ms;
    }

    .photo-selection-container {
      position: fixed;
      top: 10px;
      left: 20px;
      height: 33px;
      width: 33px;
      z-index: 20;
      display: none;
    }

    .photo-selected__indicator {
      width: 33px;
      height: 33px;
      padding-left: 2px;
      padding-top: 1px;
      color: aqua;
      background-color: white;
      border: 1px solid white;
      box-shadow: 0 0 4px 2px #fff;
      border-radius: 17px;
      z-index: 2;
      display: none;
    }

    .photo-unselected__indicator {
      width: 33px;
      height: 33px;
      padding-left: 2px;
      padding-top: 1px;
      color: #aaa;
      background-color: white;
      border: 1px solid white;
      box-shadow: 0 0 4px 2px #fff;
      border-radius: 17px;
      z-index: 2;
      display: none;
    }

    .photo-selection-container.individual-photo__selection-enabled {
      display: block;
    }

    .photo-selection-container.individual-photo__selection-enabled .photo-unselected__indicator {
      display: block;
    }

    .photo-selection-container.individual-photo__selection-enabled.individual-photo__selected .photo-selected__indicator {
      display: block;
    }

    .photo-selection-container.individual-photo__selection-enabled.individual-photo__selected .photo-unselected__indicator {
      display: none;
    }


    @media (hover) {
      .individual-photo-controls .individual-photo-controls-body {
        opacity: 0;
        background-color: rgba(200, 200, 200, 0.75);
      }

      .individual-photo-controls:hover .individual-photo-controls-body {
        opacity: 1;
      }
    }

    .return-to-search {
      position: fixed;
      top: 15px;
      right: 25px;
      z-index: 21;
      color: rgba(0, 0, 0, 0.5);
      width: 30px;
      height: 30px;
      border-radius: 15px;
      padding-top: 5px;
      text-align: center;
      font-weight: bold;
      font-family: sans-serif;
      font-size: 18px;
      background-color: rgba(150, 150, 150, 0.2);
      transition-property: background-color, color;
      transition-duration: 250ms;
      cursor: pointer;
      user-select: none;
    }

    @media (hover) {
      .return-to-search:hover {
        color: rgba(0, 0, 0, 1);
        background-color: rgba(150, 150, 150, 1.0);
      }

      .return-to-search:hover ~ .individual-photo-controls .individual-photo-controls-body {
        opacity: 1;
      }
    }

    .image-container {
      position: relative;
    }

    .download-btn, .transfer-btn {
      width: 50px;
      height: 30px;
      color: rgba(0, 0, 0, 0.5);
      border-radius: 15px;
      padding-top: 5px;
      text-align: center;
      font-weight: bold;
      font-family: "Arial", sans-serif;
      font-size: 18px;
      background-color: rgba(150, 150, 150, 0.2);
      transition-property: background-color, color;
      transition-duration: 250ms;
      cursor: pointer;
      z-index: 20;
      user-select: none;
    }

    .transfer-btn transfer-photo-button {
      top: -25px;
      display: block;
      position: relative;
    }

    @media (hover) {
      .download-btn:hover {
        color: rgba(0, 0, 0, 1);
        background-color: rgba(150, 150, 150, 1.0);
      }
    }

    .zoom-toggle {
      position: fixed;
      top: 15px;
      right: 65px;
      z-index: 21;
      width: 50px;
      height: 30px;
      color: rgba(0, 0, 0, 0.5);
      border-radius: 15px;
      padding-top: 5px;
      text-align: center;
      font-weight: bold;
      font-family: "Arial", sans-serif;
      font-size: 18px;
      background-color: rgba(150, 150, 150, 0.2);
      transition-property: background-color, color;
      transition-duration: 250ms;
      cursor: pointer;
      user-select: none;
    }

    @media (hover) {
      .zoom-toggle:hover {
        color: rgba(0, 0, 0, 1);
        background-color: rgba(150, 150, 150, 1.0);
      }

      .zoom-toggle:hover ~ .individual-photo-controls .individual-photo-controls-body {
        opacity: 1;
      }
    }

    .delete-photo {
      width: 30px;
      height: 30px;
      color: rgba(0, 0, 0, 0.5);
      border-radius: 15px;
      padding-top: 5px;
      text-align: center;
      font-weight: bold;
      font-family: "Arial", sans-serif;
      font-size: 18px;
      background-color: rgba(150, 150, 150, 0.2);
      transition-property: background-color, color;
      transition-duration: 250ms;
      cursor: pointer;
      z-index: 20;
      user-select: none;
    }

    .edit-details {
      width: 30px;
      height: 30px;
      color: rgba(0, 0, 0, 0.5);
      border-radius: 15px;
      padding-top: 5px;
      text-align: center;
      font-weight: bold;
      font-family: "Arial", sans-serif;
      font-size: 18px;
      background-color: rgba(150, 150, 150, 0.2);
      transition-property: background-color, color;
      transition-duration: 250ms;
      cursor: pointer;
      z-index: 20;
      user-select: none;
    }

    @media (hover) {
      .delete-photo:hover {
        color: #cb0101;
        background-color: rgba(150, 150, 150, 1.0);
      }

      .edit-details:hover {
        color: rgba(0, 0, 0, 1);
        background-color: rgba(150, 150, 150, 1.0);
      }
    }

    .navigation-button {
      position: fixed;
      top: 60px;
      bottom: 60px;
      width: 10vw;
      min-width: 45px;
      max-width: 75px;
      padding-top: calc(50vh - 15px);
      height: calc(100vh - 120px);
      text-align: center;
      font-weight: bold;
      font-family: sans-serif;
      font-size: 18px;
      z-index: 10;
      transition-property: background-color, color;
      transition-duration: 250ms;
      user-select: none;
    }

    .navigation-button-past {
      left: 0;
    }

    .navigation-button-past .navigation-button-icon {
      margin-left: 5px;
    }

    .navigation-button-future {
      right: 0;
      text-align: right;
    }

    .navigation-button-future .navigation-button-icon {
      margin-left: 35px;
    }

    .navigation-button-icon {
      width: 30px;
      height: 30px;
      padding-top: 5px;
      font-weight: bold;
      font-family: sans-serif;
      font-size: 18px;
      text-align: center;
      color: rgba(65, 65, 65, 0.45);
      transition-property: background-color, color;
      transition-duration: 250ms;
      cursor: pointer;
    }

    @media (hover) {
      .navigation-button {
        background-color: transparent;
        color: transparent;
      }

      .navigation-button .navigation-button-icon {
        background-color: transparent;
        color: transparent;
      }

      .navigation-button:hover {
        background-color: rgba(200, 200, 200, 0.5);
      }

      .navigation-button:hover .navigation-button-icon {
        color: rgba(0, 0, 0, 1);
      }
    }

    .photo-normal {
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      user-select: none;
    }

    .photo-normal img {
      object-fit: contain;
      height: 100% !important;
      width: 100% !important;
      user-select: none;
    }

    .photo-zoomed {
      height: 100vh;
      width: 100vw;
      overflow: auto;
      user-select: none;
      position: relative;
      min-height: 100vh;
      min-width: 100vw;
    }

    .photo-zoomed img {
      object-fit: contain;
      height: 100%;
      width: 100%;
      user-select: none;
    }
  `],
})
export class IndividualPhotoComponent {
  faTimes = faTimes;
  faChevronCircleLeft = faChevronCircleLeft;
  faChevronCircleRight = faChevronCircleRight;
  faEdit = faEdit;
  faTrash = faTrash;
  faDownload = faDownload;
  params: any;
  queryParams: any;
  photoId: number;
  readyPhotoId: number;
  photo: Photo;
  zoomLevel = 1.0;
  aspectRatio = 1.0;
  isPanning = false;
  isPinching = false;
  panningOffsetX = 0;
  panningOffsetY = 0;
  panningEl = null;
  lastZoomEvent = null;

  pinchOffsetX = 0;
  pinchOffsetY = 0;
  pinchInitialDist = 0;
  lastPinchEvent = null;

  userName = null;
  currentUsers: SignedInUsersInfo;
  currentUser: UserInfo;
  canEdit = false;
  editOpen = false;
  isSelected: boolean = false;
  isSelectionEnabled: boolean = false;

  @ViewChild('imgContainer') imgContainer: ElementRef<HTMLDivElement>;
  @ViewChild('imgHost') imgHost: ElementRef<HTMLImageElement>;
  protected readonly faCircle = faCircle;
  protected readonly faCheckCircle = faCheckCircle;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private photoService: PhotoService,
    private resultSetService: PhotoResultSetService,
    private selectionService: SelectionService,
    private userService: UserService,
    private elRef: ElementRef,
    private dialog: MatDialog,
  ) {
  }

  returnToSearch(evt) {
    evt.preventDefault();
    let curPhotoId = parseInt(this.params.photoId);
    let newParams = {...this.queryParams};
    delete newParams['photoId'];
    this.router.navigate(['../../list'], {relativeTo: this.route, fragment: 'photo__' + curPhotoId, queryParams: newParams});
  }

  keyFuturePhoto(evt) {
    if (this.zoomLevel === 1.0 && !this.editOpen) {
      this.futurePhoto(evt);
    }
  }

  futurePhoto(evt) {
    if (evt.preventDefault) {
      evt.preventDefault();
    }
    this.resultSetService.getFuturePhotoFromId(this.photoId).then((photo) => {
      console.log('Future photo ', photo);
      if (photo) {
        this.resetView();
        let newParams = {...this.queryParams};
        delete newParams['photoId'];
        this.router.navigate(['../', photo.time_id], {relativeTo: this.route, queryParams: newParams});
      }
    });
  }

  keyPastPhoto(evt) {
    if (this.zoomLevel === 1.0 && !this.editOpen) {
      this.pastPhoto(evt);
    }
  }

  pastPhoto(evt) {
    evt.preventDefault();
    this.resultSetService.getPastPhotoFromId(this.photoId).then((photo) => {
      console.log('Past photo ', photo);
      if (photo) {
        this.resetView();
        let newParams = {...this.queryParams};
        delete newParams['photoId'];
        this.router.navigate(['../', photo.time_id], {relativeTo: this.route, queryParams: newParams});
      }
    });
  }

  handleEscape(evt) {
    if (this.editOpen) {
      return;
    }
    if (this.zoomLevel === 1.0) {
      //back to results
      this.returnToSearch(evt);
    } else {
      evt.preventDefault();
      this.onZoomLevelUpdate(1.0);
    }
  }

  resetView() {
    this.zoomLevel = 1.0;
    this.panningOffsetX = 0;
    this.panningOffsetY = 0;
    if (this.panningEl) {
      this.panningEl.scrollTop = 0;
      this.panningEl.scrollLeft = 0;
      this.panningEl = null;
    }
  }

  openEdit(evt) {
    evt.preventDefault();
    if (this.canEdit) {
      console.log('Got edit photo click - opening dialog');
      this.editOpen = true;
      const dialogRef = this.dialog.open(BulkPhotoEditDialogComponent, {
        width: '450px',
        data: {
          forUserName: this.userName,
          photoIds: [this.photo.time_id]
        },
      });
      dialogRef.afterClosed().subscribe(async result => {
        this.editOpen = false;
        console.log('IndividualPhoto: Edit Photo dialog was closed', result);
        if (result && result.disposition === 'updated') {
          let query = new SearchQuery(this.queryParams);
          await this.resultSetService.updateSearch(query, true);
          setTimeout(() => this.reloadPhotoDetails(), 10);
          console.log('IndividualPhoto:   Emitting update for ' + this.photo.time_id);
        }
      });

    }
  }

  async reloadPhotoDetails() {
    console.log('IndividualPhoto: reloadPhotoDetails: Initialized for ' + this.photoId);
    return this.resultSetService.getPhotoForId(this.userName, this.photoId).then((photo) => {
      this.photo = photo;
      console.log('IndividualPhoto: reloaded photo details', this.photo);
      if (photo) {
        this.aspectRatio = photo.image_versions['screenHd']['height'] ? photo.image_versions['screenHd']['width'] * 1.0 / photo.image_versions['screenHd']['height'] : 1.0;
      } else {
        console.error('  IndividualPhoto: Photo not found for ID!', this.photoId);
      }
    }, (err) => {
      console.error('  IndividualPhoto: Error looking up photo for id!', this.photoId);
    });

  }

  @HostListener('wheel', ['$event']) onMouseWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      this.lastZoomEvent = event;
      window.requestAnimationFrame(() => {
        this.handleMouseWheelZoom();
      });
    }
  }

  pinchInitialZoom = 1;

  handleMouseWheelZoom() {
    var event = this.lastZoomEvent;
    if (event === null) {
      return;
    }
    this.lastZoomEvent = null;
    let prevZoomLevel = this.zoomLevel;
    this.zoomLevel += (-1 * (event.deltaY * (this.zoomLevel < 1.0 ? 0.25 : 1.0))) * 0.05;
    if (this.zoomLevel < 1) {
      this.zoomLevel = 1;
    } else if (this.zoomLevel > 100) {
      this.zoomLevel = 100;
    }

    let lastWidth = this.imgContainer.nativeElement.scrollWidth;
    let lastHeight = this.imgContainer.nativeElement.scrollHeight;
    let scrollLeft = this.imgContainer.nativeElement.scrollLeft;
    let scrollTop = this.imgContainer.nativeElement.scrollTop;
    let dims = this.updateZoomDims();
    let imgWidth = dims[0];
    let imgHeight = dims[1];
    let newScrollLeft = 0;
    let newScrollTop = 0;
    if (this.zoomLevel !== 1.0) {
      //Now compensate positioning to zoom in on mouse pointer
      let evtX = event.clientX;
      let evtY = event.clientY;
      let relPosX = (scrollLeft + evtX) * 1.0 / lastWidth;
      let relPosY = (scrollTop + evtY) * 1.0 / lastHeight;

      newScrollLeft = Math.round(imgWidth * relPosX) - evtX;
      newScrollTop = Math.round(imgHeight * relPosY) - evtY;

      console.log("  ZoomPosCorrection: prevZoomLevel=" + prevZoomLevel + " evtCoords=" + evtX + "/" + evtY + "; scrollOffsets=" + scrollLeft + "/" + scrollTop + " relPos=" + relPosX + "/" + relPosY + " newScroll=" + newScrollLeft + "/" + newScrollTop);
    }
    this.imgContainer.nativeElement.scrollLeft = newScrollLeft;
    this.imgContainer.nativeElement.scrollTop = newScrollTop;
    setTimeout(() => {
      //have to do it again after timeout for the initial zoom when scrollbars are added...
      this.imgContainer.nativeElement.scrollLeft = newScrollLeft;
      this.imgContainer.nativeElement.scrollTop = newScrollTop;
    }, 1);
  }

  onZoomLevelUpdate(zoomLevel) {
    let prevZoomLevel = this.zoomLevel;
    this.zoomLevel = zoomLevel;

    let lastWidth = this.imgContainer.nativeElement.scrollWidth;
    let lastHeight = this.imgContainer.nativeElement.scrollHeight;
    let scrollLeft = this.imgContainer.nativeElement.scrollLeft;
    let scrollTop = this.imgContainer.nativeElement.scrollTop;
    let dims = this.updateZoomDims();
    let imgWidth = dims[0];
    let imgHeight = dims[1];
    let newScrollLeft = 0;
    let newScrollTop = 0;
    if (this.zoomLevel !== 1.0) {
      //Now compensate positioning to zoom in on mouse pointer
      let evtX = window.innerWidth / 2;
      let evtY = window.innerHeight / 2;
      let relPosX = (scrollLeft + evtX) * 1.0 / lastWidth;
      let relPosY = (scrollTop + evtY) * 1.0 / lastHeight;

      newScrollLeft = Math.round(imgWidth * relPosX) - evtX;
      newScrollTop = Math.round(imgHeight * relPosY) - evtY;

      console.log('  PinchZoomPosCorrection: prevZoomLevel=' + prevZoomLevel + ' evtCoords=' + evtX + '/' + evtY + '; scrollOffsets=' + scrollLeft + '/' + scrollTop + ' relPos=' + relPosX + '/' + relPosY + ' newScroll=' + newScrollLeft + '/' + newScrollTop);
    }
    this.imgContainer.nativeElement.scrollLeft = newScrollLeft;
    this.imgContainer.nativeElement.scrollTop = newScrollTop;
    setTimeout(() => {
      //have to do it again after timeout for the initial zoom when scrollbars are added...
      this.imgContainer.nativeElement.scrollLeft = newScrollLeft;
      this.imgContainer.nativeElement.scrollTop = newScrollTop;
    }, 1);


  }

  onSwipe(evt) {
    if (this.zoomLevel === 1.0 && Math.abs(evt.deltaX) > 40) {
      if (evt.deltaX > 0) {
        this.pastPhoto(evt);
      } else {
        this.futurePhoto(evt);
      }
    }
  }

  onPanstart(evt, imgContainer) {
    if (this.zoomLevel !== 1.0) {
      this.isPanning = true;
      this.panningEl = imgContainer;
      this.panningOffsetX = this.panningEl.scrollLeft;
      this.panningOffsetY = this.panningEl.scrollTop;
    }
  }

  onPanMove(evt) {
    if (this.isPanning) {
      //console.log("Got pan " + evt.deltaX + "/" + evt.deltaY)
      this.panningEl.scrollTop = this.panningOffsetY - evt.deltaY;
      this.panningEl.scrollLeft = this.panningOffsetX - evt.deltaX;
    }
  }

  onPanEnd(evt) {
    if (this.isPanning) {
      this.isPanning = false;
    }
  }

  updateZoomDims() {
    if (this.zoomLevel === 1.0) {
      this.imgHost.nativeElement.style.width = "100vw";
      this.imgHost.nativeElement.style.height = "100vh";
      return [0, 0];
    }
    let clientWidth = window.innerWidth;
    let clientHeight = window.innerHeight;
    let clientAspectRatio = clientWidth / clientHeight;
    let zoomWidth = null;
    let zoomHeight = null;
    if (this.aspectRatio > clientAspectRatio) {
      //width dominated
      zoomWidth = Math.floor(clientWidth * this.zoomLevel);
      zoomHeight = Math.floor(zoomWidth / clientAspectRatio);
      //console.log("Zoom: Width: client=" + clientWidth + "/" + clientHeight + "; zoom=" + this.zoomLevel + "; aspectRatio=" + this.aspectRatio + "; zoomedDims=" + this.zoomWidth + "/" + this.zoomHeight);
    } else {
      //height dominated
      zoomHeight = Math.floor(clientHeight * this.zoomLevel);
      zoomWidth = Math.floor(zoomHeight * clientAspectRatio);
      console.log("Zoom: Height: client=" + clientWidth + "/" + clientHeight + "; zoom=" + this.zoomLevel + "; aspectRatio=" + this.aspectRatio + "; zoomedDims=" + zoomWidth + "/" + zoomHeight);
    }
    this.imgHost.nativeElement.style.width = zoomWidth + "px";
    this.imgHost.nativeElement.style.height = zoomHeight + "px";
    return [zoomWidth, zoomHeight];
  }

  onPinchStart(evt) {
    this.isPinching = true;
    this.pinchOffsetX = evt.center.x;
    this.pinchOffsetY = evt.center.y;
    this.pinchInitialZoom = this.zoomLevel;
  }

  onPinchMove(evt) {
    if (this.isPinching) {
      this.lastPinchEvent = evt;
      window.requestAnimationFrame(() => {
        this.handlePinchMove();
      });

    }
  }

  handlePinchMove() {
    var event = this.lastPinchEvent;
    if (event === null) {
      return;
    }
    this.lastPinchEvent = null;
    let prevZoomLevel = this.zoomLevel;
    this.zoomLevel = event.scale * this.pinchInitialZoom;
    if (this.zoomLevel < 1) {
      this.zoomLevel = 1;
    } else if (this.zoomLevel > 100) {
      this.zoomLevel = 100;
    }
    console.log('  #### Handling pinch zoom: ' + event.scale + ' * ' + this.pinchInitialZoom + ' results in ' + this.zoomLevel);

    let lastWidth = this.imgContainer.nativeElement.scrollWidth;
    let lastHeight = this.imgContainer.nativeElement.scrollHeight;
    let scrollLeft = this.imgContainer.nativeElement.scrollLeft;
    let scrollTop = this.imgContainer.nativeElement.scrollTop;
    let dims = this.updateZoomDims();
    let imgWidth = dims[0];
    let imgHeight = dims[1];
    let newScrollLeft = 0;
    let newScrollTop = 0;
    if (this.zoomLevel !== 1.0) {
      //Now compensate positioning to zoom in on mouse pointer
      let evtX = this.pinchOffsetX;
      let evtY = this.pinchOffsetY;
      let relPosX = (scrollLeft + evtX) * 1.0 / lastWidth;
      let relPosY = (scrollTop + evtY) * 1.0 / lastHeight;

      newScrollLeft = Math.round(imgWidth * relPosX) - evtX;
      newScrollTop = Math.round(imgHeight * relPosY) - evtY;

      console.log("  PinchZoomPosCorrection: prevZoomLevel=" + prevZoomLevel + " evtCoords=" + evtX + "/" + evtY + "; scrollOffsets=" + scrollLeft + "/" + scrollTop + " relPos=" + relPosX + "/" + relPosY + " newScroll=" + newScrollLeft + "/" + newScrollTop);
    }
    this.imgContainer.nativeElement.scrollLeft = newScrollLeft;
    this.imgContainer.nativeElement.scrollTop = newScrollTop;
    setTimeout(() => {
      //have to do it again after timeout for the initial zoom when scrollbars are added...
      this.imgContainer.nativeElement.scrollLeft = newScrollLeft;
      this.imgContainer.nativeElement.scrollTop = newScrollTop;
    }, 1);


  }

  onPinchEnd(evt) {
    if (this.isPinching) {
      this.isPinching = false;
    }
  }

  handleZoom(evt) {
    if (this.editOpen) {
      return;
    }
    let inc = 0.1;
    if (this.zoomLevel > 5) {
      inc = 0.4;
    }
    if (this.zoomLevel < 1) {
      inc = 0;
    }
    this.onZoomLevelUpdate(this.zoomLevel + inc);
    evt.preventDefault();

  }

  handleUnzoom(evt) {
    if (this.editOpen) {
      return;
    }
    let inc = 0.1;
    if (this.zoomLevel > 5) {
      inc = 0.4;
    }
    if (this.zoomLevel < 1) {
      inc = 0;
    }
    if (this.zoomLevel > 1) {
      if (this.zoomLevel - inc < 1) {
        this.onZoomLevelUpdate(1.0);
      } else {
        this.onZoomLevelUpdate(this.zoomLevel - inc);
      }
    }
    evt.preventDefault();
  }

  confirmDelete(evt) {
    if (confirm('Are you sure you want to delete this photo?')) {
      //transition to the future photo and THEN delete
      this.resultSetService.getFuturePhotoFromId(this.photoId).then((photo) => {
        console.log('Future photo ', photo);
        if (photo) {
          this.resetView();
          let newParams = {...this.queryParams};
          delete newParams['photoId'];
          this.router.navigate(['../', photo.time_id], {relativeTo: this.route, queryParams: newParams});
          //now delete the photo
          this.photoService.deletePhotos(
            this.currentUser.authenticationToken,
            this.currentUser.userName,
            [this.photo.time_id]).subscribe(() => {
            console.log('Successfully deleted photo');
            this.resultSetService.updateSearch(this.resultSetService.getSearch(), true).then(() => {
              console.log('Refreshed after delete completed');
            });
          }, () => {
            console.error('FAILURE: failed while deleting individual photo! ', this.photo.time_id);
          });
        } else {
          this.photoService.deletePhotos(
            this.currentUser.authenticationToken,
            this.currentUser.userName,
            [this.photo.time_id]).subscribe(() => {
            console.log('Successfully deleted photo');
            this.resultSetService.updateSearch(this.resultSetService.getSearch(), true).then(() => {
              console.log('Refreshed after delete completed');
            });
          }, () => {
            console.error('FAILURE: failed while deleting individual photo! ', this.photo.time_id);
          });
        }
      });
    }
  }

  ngOnInit() {
    let query = null;

    //have to wait for query params AND photo id
    let fetchResultsWhenReady = async () => {
      console.log('Checking fetchResultsWhenReady ' + this.readyPhotoId, this.photoId, query);
      if (this.photoId && query && this.readyPhotoId !== this.photoId) {
        console.log(' fetchResultsWhenReady --- Running query: ' + this.readyPhotoId, this.photoId, query);
        await this.resultSetService.updateSearch(query);
        await this.reloadPhotoDetails();
        this.readyPhotoId = this.photoId;
        this.refreshSelectionStatus();
      }
    };

    this.route.queryParams.subscribe(queryParams => {
      //TODO: get linked search params from here
      this.queryParams = queryParams;
      query = new SearchQuery(queryParams);
      fetchResultsWhenReady();
    });

    this.route.params.subscribe(params => {
      //TODO: get linked search params from here
      this.params = params;
      if (params.photoId) {
        this.userName = params['userName'];
        console.log('  IndividualPhoto: Got PhotoID as ' + params['photoId']);
        this.photoId = parseInt(params['photoId']);
        fetchResultsWhenReady();
      } else {
        console.error('  IndividualPhoto: No photoId found!', params);
      }
    });

    this.userService.getCurrentUsers$().subscribe((currentUsers) => {
      this.currentUsers = currentUsers;
      this.currentUser = this.currentUsers.userInfosByName[this.userName];

      this.canEdit = !!this.currentUser; //this.userService.hasAccessToUser(this.currentUser, this.userName);
    });

    this.selectionService.getSelectionEnabled$().subscribe((selectionEnabled) => {
      this.isSelectionEnabled = selectionEnabled;
    });
    this.refreshSelectionStatus();
  }

  refreshSelectionStatus() {
    this.selectionService.getSelectedPhotosById$().subscribe((selectedPhotos) => {
      if (selectedPhotos && this.photo && this.photo.time_id) {
        this.isSelected = !!selectedPhotos[this.photo.time_id];
      }
    });
  }

  onSelectClick(evt) {
    if (this.isSelectionEnabled) {
      if (evt) {
        evt.stopPropagation();
        evt.preventDefault();
      }
      //selection is enabled - click is to toggle select photo
      let photosById = {...this.selectionService.getSelectedPhotosById$().getValue()};
      if (this.isSelected) {
        delete photosById[this.photo.time_id];
      } else {
        photosById[this.photo.time_id] = this.photo;
      }
      this.selectionService.getSelectedPhotosById$().next(photosById);
    }
  }
}
