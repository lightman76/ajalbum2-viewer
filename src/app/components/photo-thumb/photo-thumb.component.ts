import {Component, Input} from '@angular/core';
import {Photo} from '../../helper/photo';
import {ActivatedRoute, Router} from '@angular/router';
import {SearchQuery} from '../../services/helper/search-query';
import {SelectionService} from '../../services/selection.service';
import {faCheckCircle} from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'photo-thumb',
  template: `
    <div class="photo-thumb"
         (click)="onClick($event)"
         [class.photo-thumb__selected]="isSelected"
         tabindex="0"
         [attr.id]="'photo_thumb_'+photo.time_id">
      <span class="photo-selected__indicator">
        <fa-icon [icon]="faCheckCircle" [size]="'2x'"></fa-icon>
      </span>
      <img *ngIf="photo.image_versions['thumb']"
           [attr.src]="'storage/'+photo.image_versions['thumb'].root_store+'/'+photo.image_versions['thumb'].relative_path"
           [attr.alt]="photo.title">
    </div>
  `,
  styles: [`
    .photo-thumb {
      box-sizing: border-box;
      border: 1px solid #666;
      width: 100%;
      height: 100%;
      cursor: pointer;
      border-radius: 15px;
      position: relative;
    }

    .photo-selected__indicator {
      position: absolute;
      top: 15px;
      left: 15px;
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

    .photo-thumb.photo-thumb__selected {
      border-color: aqua;
    }

    .photo-thumb.photo-thumb__selected:before {
      content: "";
      border-radius: 15px;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 4;
      box-shadow: inset 0px 0px 15px 3px aqua;
      pointer-events: none;
    }

    .photo-thumb.photo-thumb__selected .photo-selected__indicator {
      display: block;
    }

    .photo-thumb img {
      border-radius: 15px;
      width: 100%;
      height: 100%;
    }

  `],
})
export class PhotoThumbComponent {
  faCheckCircle = faCheckCircle;
  @Input() photo: Photo;
  @Input() currentQuery: SearchQuery;

  isSelected: boolean = false;

  constructor(private router: Router,
              private selectionService: SelectionService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.selectionService.getSelectedPhotosById$().subscribe((selectedPhotos) => {
      if (selectedPhotos && this.photo && this.photo.id) {
        this.isSelected = selectedPhotos[this.photo.id] || false;
      }
    });
  }

  onClick(evt) {
    if (this.selectionService.getSelectionEnabled$().getValue()) {
      //selection is enabled - click is to toggle select photo
      let photosById = {...this.selectionService.getSelectedPhotosById$().getValue()};
      photosById[this.photo.id] = !this.isSelected;
      this.selectionService.getSelectedPhotosById$().next(photosById);
    } else {
      //selection is NOT enabled - click is to view photo
      console.log('Preparing to navigate: ' + this.photo.time_id);
      let params = this.currentQuery.toQueryParamHash();
      this.router.navigate(['/' + this.currentQuery.userName + '/photo', this.photo.time_id], {queryParams: params});
    }
  }
}
