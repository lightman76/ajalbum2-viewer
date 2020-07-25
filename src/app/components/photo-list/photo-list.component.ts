import {Component} from "@angular/core";
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import {PhotoService} from "../../services/photo.service";
import {SearchQuery} from "../../services/helper/search-query";
import {PhotoResultSetService} from "../../services/photo-result-set.service";
import {PhotosForDay} from "../../helper/photos-for-day";

@Component({
  selector: 'photo-list',
  template: `
    <div>Hello world</div>
    <div>Params: {{params|json}}</div>
    <hr/>
    <div class="results">
    <photos-for-day [pfd]="pfd" *ngFor="let pfd of photosByDate"></photos-for-day>
    </div>
  `,
  styles: [`
    :host {
      padding: 20px;
      display: block;
    }
  `],


})
export class PhotoListComponent {
  params:any;

  photosByDate:Array<PhotosForDay>;

  constructor(
    private route:ActivatedRoute,
    private photoService:PhotoService,
    private resultSetService:PhotoResultSetService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params=>{
      //TODO: get linked search params from here
      this.params = params;
      this.resultSetService.getPhotosByDay$().subscribe((photosByDate)=>{
        this.photosByDate = photosByDate;
      })
      this.resultSetService.updateSearch(new SearchQuery(params));
    });
  }
}
