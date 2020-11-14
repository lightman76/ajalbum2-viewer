import {Component} from "@angular/core";
import {ActivatedRoute} from '@angular/router';
import {PhotoService} from "../../services/photo.service";
import {SearchQuery} from "../../services/helper/search-query";
import {PhotoResultSetService} from "../../services/photo-result-set.service";
import {Photo} from "../../helper/photo";

@Component({
  selector: 'individual-photo',
  template: `
    <div class="individual-photo-container">
      <div class="is_loading" *ngIf="!photoId && !photo">No photo id found...</div>
      <div class="is_loading" *ngIf="photoId && !photo">Loading...</div>
      <div class="is_loading" *ngIf="photoId && photo">
        <img *ngIf="photo.image_versions['screenHd']"
             [attr.src]="'storage/'+photo.image_versions['screenHd'].root_store+'/'+photo.image_versions['screenHd'].relative_path"
             [attr.alt]="photo.title">
      </div>
    </div>
  `,
  styles: [`
  `],


})
export class IndividualPhotoComponent {
  params: any;
  queryParams: any;
  photoId: number;
  photo: Photo;

  constructor(
    private route: ActivatedRoute,
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
}
