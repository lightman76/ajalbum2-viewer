import {Component, ElementRef} from "@angular/core";
import {ActivatedRoute, Params, Router} from '@angular/router';
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
      <photos-for-day [pfd]="pfd" [focusPhotoId]="focusPhotoId" *ngFor="let pfd of photosByDate"
                      [currentQuery]="currentSearch"></photos-for-day>
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
  focusPhotoId = null;
  currentSearch: SearchQuery;
  private fragment;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private photoService: PhotoService,
    private resultSetService: PhotoResultSetService,
    private elRef: ElementRef,
  ) {
  }

  ngOnInit() {
    this.route.fragment.subscribe(fragment => {
      this.fragment = fragment;
      if (this.fragment) {
        if (this.currentSearch) {
          let photoIdRegEx = /photo__([0-9]+)/.exec(this.fragment);
          if (photoIdRegEx) {
            let photoId = photoIdRegEx[1];
            this.focusPhotoId = parseInt(photoId);
            let date = new Date(parseInt(photoId));
            this.currentSearch.offsetDate = PhotosForDay.dateToDayStr(date);
            this.resultSetService.updateSearch(this.currentSearch);
          }
        }
      } else {
        this.focusPhotoId = null;
      }
    });
    this.route.queryParams.subscribe(params => {
      //TODO: get linked search params from here
      this.params = params;
      this.resultSetService.getPhotosByDay$().subscribe((photosByDate) => {
        this.photosByDate = photosByDate;
      });
      this.currentSearch = new SearchQuery(params);
      if (this.fragment) {
        let photoIdRegEx = /photo__([0-9]+)/.exec(this.fragment);
        if (photoIdRegEx) {
          let photoId = photoIdRegEx[1];
          this.focusPhotoId = parseInt(photoId);
          let date = new Date(parseInt(photoId));
          this.currentSearch.offsetDate = PhotosForDay.dateToDayStr(date);
        }
      }
      this.resultSetService.updateSearch(this.currentSearch);
    });
  }

  onSearchUpdated(query) {
    this.currentSearch = query;
    const queryParams: Params = this.currentSearch.toQueryParamHash();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams, //note, can use queryParamsHandling: "merge" to merge with existing rather than replace
    });
    this.resultSetService.updateSearch(query);
    if (this.focusPhotoId === null) {
      //Need to scroll results back to top
      try {
        this.elRef.nativeElement.getElementsByClassName('results')[0].scrollTop = 0;
      } catch (e) {
      }
    }
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
