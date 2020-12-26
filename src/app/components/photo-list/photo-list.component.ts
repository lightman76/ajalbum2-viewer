import {Component} from "@angular/core";
import {ActivatedRoute} from '@angular/router';
import {PhotoService} from "../../services/photo.service";
import {SearchQuery} from "../../services/helper/search-query";
import {PhotoResultSetService} from "../../services/photo-result-set.service";
import {PhotosForDay} from "../../helper/photos-for-day";

@Component({
  selector: 'photo-list',
  template: `
    <div class="control-bar">
      <photo-search [searchQuery]="currentSearch" (searchUpdated)="onSearchUpdated($event)"></photo-search>
    </div>
    <div class="results" (scroll)="handleScroll($event)">
      <photos-for-day [pfd]="pfd" *ngFor="let pfd of photosByDate"></photos-for-day>
    </div>
  `,
  styles: [`
    :host {
      /*
      padding-left: 20 px;
      padding-right: 20 px;
      */
      display: block;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
    }

    .control-bar {
      height: 45px;
      width: 100vw;
    }

    .results {
      width: 100%;
      height: calc(100% - 45px);
      overflow: auto;
    }
  `],


})
export class PhotoListComponent {
  params: any;

  photosByDate: Array<PhotosForDay>;
  private lastScrollOffset = 0;
  private requestedAnimationFrame = false;
  currentSearch: SearchQuery;

  constructor(
    private route: ActivatedRoute,
    private photoService: PhotoService,
    private resultSetService: PhotoResultSetService,
  ) {
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      //TODO: get linked search params from here
      this.params = params;
      this.resultSetService.getPhotosByDay$().subscribe((photosByDate) => {
        this.photosByDate = photosByDate;
      });
      this.currentSearch = new SearchQuery(params);
      console.log("Updating search query from queryParams to " + JSON.stringify(this.currentSearch));
      this.resultSetService.updateSearch(this.currentSearch);
    });
  }

  onSearchUpdated(query) {
    this.currentSearch = query;
    this.resultSetService.updateSearch(query);
  }

  handleScroll(evt) {
    this.lastScrollOffset = evt.target.scrollTop;
    if (!this.requestedAnimationFrame) {
      this.requestedAnimationFrame = true;
      requestAnimationFrame(() => {
        this.updateScrollPos();
      });
    }
  }

  updateScrollPos() {
    this.requestedAnimationFrame = false;
    this.resultSetService.getScrollOffset$().next(this.lastScrollOffset);
  }
}
