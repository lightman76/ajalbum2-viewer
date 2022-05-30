import {Component, ElementRef, HostListener, ViewChild} from "@angular/core";
import {ActivatedRoute, Router} from '@angular/router';
import {PhotoService} from "../../services/photo.service";
import {SearchQuery} from "../../services/helper/search-query";
import {PhotoResultSetService} from "../../services/photo-result-set.service";
import {Photo} from "../../helper/photo";
import {faChevronCircleLeft, faChevronCircleRight, faSearchPlus, faTimes} from "@fortawesome/pro-solid-svg-icons";

@Component({
  selector: 'individual-photo',
  template: `
    <div class="individual-photo-container"
    >
      <div class="return-to-search" (click)="returnToSearch($event)" [matTooltip]="'Return to search results'">
        <fa-icon [icon]="faTimes"></fa-icon>
      </div>
      <div class="zoom-toggle" (click)="zoomToggle($event)" [matTooltip]="'Toggle zoom'">
        <fa-icon [icon]="faSearchPlus"></fa-icon>
      </div>
      <div class="navigation-button navigation-button-past" (click)="pastPhoto($event)" [matTooltip]="'Previous photo'" [matTooltipPosition]="'right'">
        <div class="navigation-button-icon">
          <fa-icon [icon]="faChevronCircleLeft" [size]="'2x'"></fa-icon>
        </div>
      </div>
      <div class="navigation-button navigation-button-future" (click)="futurePhoto($event)" [matTooltip]="'Next Photo'" [matTooltipPosition]="'left'">
        <div class="navigation-button-icon">
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
             [attr.src]="'storage/'+photo.image_versions['screenHd'].root_store+'/'+(zoomLevel === 1.0 ? photo.image_versions['screenHd'].relative_path: photo.image_versions['fullRes'].relative_path)"
             [attr.alt]="photo.title">
      </div>
      <individual-photo-info [photo]="photo" *ngIf="photo"></individual-photo-info>
    </div>
  `,
  styles: [`
    .individual-photo-container {
      position: relative;
    }

    .return-to-search {
      position: fixed;
      top: 10px;
      right: 20px;
      width: 30px;
      height: 30px;
      color: rgba(0, 0, 0, 0.5);
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
      z-index: 20;
      user-select: none;
    }

    .return-to-search:hover {
      color: rgba(0, 0, 0, 1);
      background-color: rgba(150, 150, 150, 1.0);
    }

    .image-container {
      position: relative;
    }

    .zoom-toggle {
      position: fixed;
      top: 10px;
      right: 50px;
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

    .zoom-toggle:hover {
      color: rgba(0, 0, 0, 1);
      background-color: rgba(150, 150, 150, 1.0);
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

    .navigation-button:hover {
      background-color: rgba(200, 200, 200, 0.5);
    }

    .navigation-button:hover .navigation-button-icon {
      color: rgba(0, 0, 0, 1);

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
    }

    .photo-zoomed img {
      object-fit: contain;
      height: 100%;
      width: 100%;
      min-height: 100vh;
      min-width: 100vw;
      user-select: none;
    }
  `],
})
export class IndividualPhotoComponent {
  params: any;
  queryParams: any;
  photoId: number;
  photo: Photo;
  zoomLevel = 1.0;
  aspectRatio = 1.0;
  faSearchPlus = faSearchPlus;
  faTimes = faTimes;
  faChevronCircleLeft = faChevronCircleLeft;
  faChevronCircleRight = faChevronCircleRight;
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

  @ViewChild('imgContainer') imgContainer: ElementRef<HTMLDivElement>;
  @ViewChild('imgHost') imgHost: ElementRef<HTMLImageElement>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private photoService: PhotoService,
    private resultSetService: PhotoResultSetService,
    private elRef: ElementRef,
  ) {
  }

  ngOnInit() {
    this.route.queryParams.subscribe(queryParams => {
      //TODO: get linked search params from here
      this.queryParams = queryParams;
      let query = new SearchQuery(queryParams);
      this.resultSetService.updateSearch(query);
    });

    this.route.params.subscribe(params => {
      //TODO: get linked search params from here
      this.params = params;
      if (params.photoId) {
        this.userName = params['userName'];
        console.log("  IndividualPhoto: Got PhotoID as " + params["photoId"]);
        this.photoId = parseInt(params["photoId"]);
        this.resultSetService.getPhotoForId(this.userName, this.photoId).then((photo) => {
          this.photo = photo;
          if (photo) {
            this.aspectRatio = photo.image_versions['screenHd']['height'] ? photo.image_versions['screenHd']['width'] * 1.0 / photo.image_versions['screenHd']['height'] : 1.0;
          } else {
            console.error("  IndividualPhoto: Photo not found for ID!", this.photoId);
          }
        });
      } else {
        console.error("  IndividualPhoto: No photoId found!", params)
      }
    });
  }

  returnToSearch(evt) {
    evt.preventDefault();
    let curPhotoId = this.params.photoId;
    let newParams = {...this.queryParams};
    delete newParams['photoId'];
    this.router.navigate(["../../list"], {relativeTo: this.route, fragment: "photo__" + curPhotoId, queryParams: newParams});
  }

  futurePhoto(evt) {
    evt.preventDefault();
    this.resultSetService.getFuturePhotoFromId(this.photoId).then((photo) => {
      console.log("Future photo ", photo);
      if (photo) {
        this.resetView();
        let newParams = {...this.queryParams};
        delete newParams["photoId"];
        this.router.navigate(["../", photo.time_id], {relativeTo: this.route, queryParams: newParams});
      }
    });
  }

  pastPhoto(evt) {
    evt.preventDefault();
    this.resultSetService.getPastPhotoFromId(this.photoId).then((photo) => {
      console.log("Past photo ", photo);
      if (photo) {
        this.resetView();
        let newParams = {...this.queryParams};
        delete newParams["photoId"];
        this.router.navigate(["../", photo.time_id], {relativeTo: this.route, queryParams: newParams});
      }
    });
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
    if (event === null) return;
    this.lastZoomEvent = null;
    let prevZoomLevel = this.zoomLevel;
    this.zoomLevel += (-1 * event.deltaY) * 0.05;
    if (this.zoomLevel < 1.0) {
      this.zoomLevel = 1.0;
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


  zoomToggle(evt) {
    evt.preventDefault();
    if (this.zoomLevel === 1.0) {
      this.zoomLevel = 2.0;
    } else {
      this.zoomLevel = 1.0;
    }
  }

  onSwipe(evt) {
    if (this.zoomLevel === 1.0 && Math.abs(evt.deltaX) > 40) {
      if (evt.deltaX > 0) {
        this.futurePhoto(evt);
      } else {
        this.pastPhoto(evt);
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
    if (event === null) return;
    this.lastPinchEvent = null;
    let prevZoomLevel = this.zoomLevel;
    this.zoomLevel = event.scale * this.pinchInitialZoom;
    if (this.zoomLevel < 1.0) {
      this.zoomLevel = 1.0;
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
}
