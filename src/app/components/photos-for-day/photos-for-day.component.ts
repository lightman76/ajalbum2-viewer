import {Component, ElementRef, Input, SimpleChanges} from "@angular/core";
import {PhotosForDay} from "../../helper/photos-for-day";
import {Photo} from "../../helper/photo";
import {SearchQuery} from "../../services/helper/search-query";

@Component({
  selector: 'photos-for-day',
  template: `
    <div class="date-header"
         [attr.id]="'day-list__'+pfd.forDate.getFullYear()+'-'+(pfd.forDate.getMonth() + 1)+'-'+pfd.forDate.getDate()">{{pfd.forDate.getFullYear()}}
      /{{pfd.forDate.getMonth() + 1}}
      /{{pfd.forDate.getDate()}}</div>
    <div class="photo-list" *ngIf="pfd.dateInViewRange || pfd.photoResultsLoaded">
      <div class="photo-item" *ngFor="let photo of photoList">
        <photo-thumb [photo]="photo" [currentQuery]="currentQuery"></photo-thumb>
      </div>
    </div>
  `,
  host: {
    "[style.height]": "pfd.displayHeight$.getValue()+'px'"
  },
  styles: [`
    :host {
      display: block;
    }

    .date-header {
      border-top: 1px solid #999;
      font-weight: bold;
      font-size: 24px;
      padding-top: 10px;
      padding-left: 15px;
    }

    .photo-list {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      overflow: hidden;
    }

    .photo-item {
      flex: 0 0 260px;
      height: 260px;
      max-width: 30vw;
      max-height: 30vw;
      margin: 5px;
    }
  `],


})
export class PhotosForDayComponent {
  @Input() pfd: PhotosForDay;
  @Input() currentQuery: SearchQuery;
  @Input() focusPhotoId: number;

  photoList: Array<Photo>;

  constructor(private elRef: ElementRef) {
  }

  ngOnInit() {
    this.checkForFocusPhoto();
    this.pfd.getPhotoList$().subscribe((photoList: Array<Photo>) => {
      this.photoList = photoList;
      if (this.focusPhotoId) {
        this.photoList.forEach((photo: Photo) => {
          if (photo.time_id === this.focusPhotoId) {
            setTimeout(() => {
              try {
                document.getElementById("photo_thumb_" + this.focusPhotoId).scrollIntoView({block: 'start'});
              } catch (e) {
                console.error("failed to scroll photo into view", e);
              }
            }, 100);
          }
        });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    let focusPhotoIdChange = changes['focusPhotoId'];
    if (focusPhotoIdChange && focusPhotoIdChange.currentValue !== focusPhotoIdChange.previousValue) {
      this.checkForFocusPhoto();
    }

  }


  checkForFocusPhoto() {
    if (this.focusPhotoId) {
      let d = new Date(this.focusPhotoId);
      if (PhotosForDay.dateToDayStr(d) === PhotosForDay.dateToDayStr(this.pfd.forDate)) {
        //Scroll this into view
        try {
          this.elRef.nativeElement.scrollIntoView({block: 'start'});
        } catch (e) {
          console.error("failed to scroll day into view", e);
        }
      }
    }
  }
}
