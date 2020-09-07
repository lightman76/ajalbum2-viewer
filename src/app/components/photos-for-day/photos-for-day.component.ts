import {Component, Input} from "@angular/core";
import {PhotosForDay} from "../../helper/photos-for-day";
import {Photo} from "../../helper/photo";

@Component({
  selector: 'photos-for-day',
  template: `
    <div class="date-header">{{pfd.forDate.getFullYear()}}/{{pfd.forDate.getMonth() + 1}}
      /{{pfd.forDate.getDate()}}</div>
    <div class="photo-list" *ngIf="pfd.dateInViewRange || pfd.photoResultsLoaded">
      <div class="photo-item" *ngFor="let photo of photoList">
        <photo-thumb [photo]="photo"></photo-thumb>
      </div>
    </div>
  `,
  host: {
    "[style.height]": "pfd.displayHeight$.getValue()+'px'",
    "[style.backgroundColor]": "(pfd.photoResultsLoaded ? 'green' : 'red')"
  },
  styles: [`
    :host {
      display: block;
    }

    .date-header {
      border-top: 1px solid #999;
      font-weight: bold;
      font-size: 20px;
    }

    .photo-list {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      overflow: hidden;
    }

    .photo-item {
      flex: 0 0 250px;
      margin: 10px;
    }
  `],


})
export class PhotosForDayComponent {
  @Input() pfd:PhotosForDay;

  photoList:Array<Photo>;

  constructor() {}

  ngOnInit() {
    this.pfd.getPhotoList$().subscribe((photoList:Array<Photo>)=>{
      this.photoList = photoList;
    });
  }
}
