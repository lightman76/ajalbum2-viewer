import {Component} from "@angular/core";
import {ActivatedRoute, Router} from '@angular/router';
import {PhotoService} from "../../services/photo.service";
import {SearchQuery} from "../../services/helper/search-query";
import {PhotoResultSetService} from "../../services/photo-result-set.service";
import {Photo} from "../../helper/photo";
import {faChevronCircleLeft, faChevronCircleRight, faSearch, faTimes} from "@fortawesome/pro-solid-svg-icons";

@Component({
  selector: 'individual-photo',
  template: `
    <div class="individual-photo-container">
      <div class="return-to-search" (click)="returnToSearch($event)">
        <fa-icon [icon]="faTimes"></fa-icon>
      </div>
      <div class="zoom-toggle" (click)="zoomToggle($event)">
        <fa-icon [icon]="faSearch"></fa-icon>
      </div>
      <div class="navigation-button navigation-button-future" (click)="futurePhoto($event)">
        <div class="navigation-button-icon">
          <fa-icon [icon]="faChevronCircleLeft"></fa-icon>
        </div>
      </div>
      <div class="navigation-button navigation-button-past" (click)="pastPhoto($event)">
        <div class="navigation-button-icon">
          <fa-icon [icon]="faChevronCircleRight"></fa-icon>
        </div>
      </div>
      <div class="is_loading" *ngIf="!photoId && !photo">No photo id found...</div>
      <div class="is_loading" *ngIf="photoId && !photo">Loading...</div>
      <div [ngClass]="{'photo-normal':zoomLevel === 1.0, 'photo-zoomed':zoomLevel !== 1.0}" *ngIf="photoId && photo">
        <img *ngIf="photo.image_versions['screenHd']"
             [attr.src]="'storage/'+photo.image_versions['screenHd'].root_store+'/'+(zoomLevel === 1.0 ? photo.image_versions['screenHd'].relative_path: photo.image_versions['fullRes'].relative_path)"
             [attr.alt]="photo.title">
      </div>
    </div>
  `,
  styles: [`
    .individual-photo-container {
      position: relative;
    }

    .return-to-search {
      position: fixed;
      top: 20px;
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
    }

    .return-to-search:hover {
      color: rgba(0, 0, 0, 1);
      background-color: rgba(150, 150, 150, 1.0);
    }

    .zoom-toggle {
      position: fixed;
      top: 20px;
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
    }

    .navigation-button-future {
      left: 0;
    }

    .navigation-button-past {
      right: 0;
      text-align: right;
    }

    .navigation-button-icon {
      width: 30px;
      height: 30px;
      border-radius: 15px;
      padding-top: 5px;
      font-weight: bold;
      font-family: sans-serif;
      font-size: 18px;
      text-align: center;
      color: rgba(0, 0, 0, 0.5);
      background-color: rgba(150, 150, 150, 0.2);
      transition-property: background-color, color;
      transition-duration: 250ms;
      cursor: pointer;
    }

    .navigation-button:hover {
      background-color: rgba(200, 200, 200, 0.5);
    }

    .navigation-button:hover .navigation-button-icon {
      color: rgba(0, 0, 0, 1);
      background-color: rgba(150, 150, 150, 1);
    }

    .photo-normal {
      height: 100vh;
      width: 100vw;
    }

    .photo-normal img {
      object-fit: contain;
      height: 100%;
      width: 100%;
    }

    .photo-zoomed {
      height: 100vh;
      width: 100vw;
      overflow: auto;
    }

    .photo-zoomed img {
      object-fit: none;
      height: auto;
      width: auto;
    }
  `],


})
export class IndividualPhotoComponent {
  params: any;
  queryParams: any;
  photoId: number;
  photo: Photo;
  zoomLevel = 1.0;
  faSearch = faSearch;
  faTimes = faTimes;
  faChevronCircleLeft = faChevronCircleLeft;
  faChevronCircleRight = faChevronCircleRight;

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
      this.resultSetService.updateSearch(new SearchQuery(queryParams));
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
    this.router.navigateByUrl("/");
  }

  futurePhoto(evt) {
    evt.preventDefault();
    this.resultSetService.getFuturePhotoFromId(this.photoId).then((photo) => {
      console.log("Future photo ", photo)
      if (photo) this.router.navigateByUrl("/photo/" + photo.time_id);
    });
  }

  pastPhoto(evt) {
    evt.preventDefault();
    this.resultSetService.getPastPhotoFromId(this.photoId).then((photo) => {
      console.log("Past photo ", photo)
      if (photo) this.router.navigateByUrl("/photo/" + photo.time_id);
    });
  }

  zoomToggle(evt) {
    evt.preventDefault();
    if (this.zoomLevel === 1.0) {
      this.zoomLevel = 2.0;
    } else {
      this.zoomLevel = 1.0;
    }
  }
}
