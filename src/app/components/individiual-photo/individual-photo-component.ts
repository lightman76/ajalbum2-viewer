import {Component} from "@angular/core";
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
      <div class="return-to-search" (click)="returnToSearch($event)">
        <fa-icon [icon]="faTimes"></fa-icon>
      </div>
      <div class="zoom-toggle" (click)="zoomToggle($event)">
        <fa-icon [icon]="faSearchPlus"></fa-icon>
      </div>
      <div class="navigation-button navigation-button-future" (click)="futurePhoto($event)">
        <div class="navigation-button-icon">
          <fa-icon [icon]="faChevronCircleLeft" [size]="'2x'"></fa-icon>
        </div>
      </div>
      <div class="navigation-button navigation-button-past" (click)="pastPhoto($event)">
        <div class="navigation-button-icon">
          <fa-icon [icon]="faChevronCircleRight" [size]="'2x'"></fa-icon>
        </div>
      </div>
      <div class="is_loading" *ngIf="!photoId && !photo">No photo id found...</div>
      <div class="is_loading" *ngIf="photoId && !photo">Loading...</div>
      <div [ngClass]="{'photo-normal':zoomLevel === 1.0, 'photo-zoomed':zoomLevel !== 1.0}"
           *ngIf="photoId && photo"
           #imgContainer
           [ngStyle]="{'top':topOffset+'px','left':leftOffset+'px'}"
           (panstart)="onPanstart($event,imgContainer)"
           (panmove)="onPanMove($event)"
           (panend)="onPanEnd($event)"
           (swipe)="onSwipe($event)">
        <img *ngIf="photo.image_versions['screenHd']"
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
      top: 40px;
      bottom: 40px;
      width: 10vw;
      min-width: 45px;
      max-width: 75px;
      padding-top: calc(50vh - 15px);
      height: calc(100vh - 80px);
      text-align: center;
      font-weight: bold;
      font-family: sans-serif;
      font-size: 18px;
      z-index: 10;
      transition-property: background-color, color;
      transition-duration: 250ms;
      user-select: none;
    }

    .navigation-button-future {
      left: 0;
    }

    .navigation-button-future .navigation-button-icon {
      margin-left: 5px;
    }

    .navigation-button-past {
      right: 0;
      text-align: right;
    }

    .navigation-button-past .navigation-button-icon {
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
      user-select: none;
    }

    .photo-normal img {
      object-fit: contain;
      height: 100%;
      width: 100%;
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
      object-fit: none;
      height: auto;
      width: auto;
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
  faSearchPlus = faSearchPlus;
  faTimes = faTimes;
  faChevronCircleLeft = faChevronCircleLeft;
  faChevronCircleRight = faChevronCircleRight;
  isPanning = false;
  topOffset = 0;
  leftOffset = 0;
  panningOffsetX = 0;
  panningOffsetY = 0;
  panningEl = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private photoService: PhotoService,
    private resultSetService: PhotoResultSetService,
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
        console.log("  IndividualPhoto: Got PhotoID as " + params["photoId"]);
        this.photoId = params["photoId"];
        this.resultSetService.getPhotoForId(this.photoId).then((photo) => {
          this.photo = photo;
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
    this.router.navigate(["../"], {relativeTo: this.route, fragment: "photo__" + curPhotoId, queryParams: newParams});
  }

  futurePhoto(evt) {
    evt.preventDefault();
    this.resultSetService.getFuturePhotoFromId(this.photoId).then((photo) => {
      console.log("Future photo ", photo)
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
      console.log("Past photo ", photo)
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
    this.topOffset = 0;
    this.leftOffset = 0;
    this.panningOffsetX = 0;
    this.panningOffsetY = 0;
    if (this.panningEl) {
      this.panningEl.scrollTop = 0;
      this.panningEl.scrollLeft = 0;
      this.panningEl = null;
    }
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
      console.log("Got pan " + evt.deltaX + "/" + evt.deltaY)
      this.panningEl.scrollTop = this.panningOffsetY - evt.deltaY;
      this.panningEl.scrollLeft = this.panningOffsetX - evt.deltaX;
    }
  }

  onPanEnd(evt) {
    if (this.isPanning) {
      this.isPanning = false;
    }
  }

}
