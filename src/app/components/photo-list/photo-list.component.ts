import {Component, ElementRef} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {PhotoService} from '../../services/photo.service';
import {SearchQuery} from '../../services/helper/search-query';
import {PhotoResultSetService} from '../../services/photo-result-set.service';
import {PhotosForDay} from '../../helper/photos-for-day';
import {distinct} from 'rxjs/operators';

@Component({
  selector: 'photo-list',
  template: `
    <div class="control-bar">
      <div class="control-bar-search">
        <photo-search [searchQuery]="currentSearch" (searchUpdated)="onSearchUpdated($event)"></photo-search>
      </div>
      <div class="control-bar-login">
        <edit-photo-button
          [usageContext]="'multi'"
          [viewingUser]="currentSearch.userName"
          (photosUpdated)="onPhotosEdited($event)"
        ></edit-photo-button>
        <delete-photo-button
          [usageContext]="'multi'"
          [viewingUser]="currentSearch.userName"
          (afterDelete)="onPhotosEdited($event)"
        ></delete-photo-button>
        <transfer-photo-button
          [usageContext]="'multi'"
          [viewingUser]="currentSearch.userName"
          (afterTransfer)="onPhotosEdited($event)"
        ></transfer-photo-button>
        <photo-selection-toggle [viewingUser]="currentSearch.userName"></photo-selection-toggle>
        <login-indicator [viewingUser]="currentSearch.userName"></login-indicator>
      </div>

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
      height: 79px;
      display: flex;
    }

    .control-bar-search {
      height: 79px;
      flex: 1 1 100%;
    }

    .control-bar-login {
      height: 100px;
      flex: 1 0 auto;
    }

    .results {
      width: 100%;
      height: calc(100% - 79px);
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
  private userName;

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
          const photoIdRegEx = /photo__([0-9]+)/.exec(this.fragment);
          if (photoIdRegEx) {
            const photoId = photoIdRegEx[1];
            this.focusPhotoId = parseInt(photoId);
            const date = new Date(parseInt(photoId));
            this.currentSearch.offsetDate = parseInt(PhotosForDay.dateToDayStr(date));
            this.resultSetService.updateSearch(this.currentSearch);
            let wl = window.location;
            //window.location.replace(wl.protocol+wl.hostname+wl.pathname+wl.search)
          }
        }
      } else {
        this.focusPhotoId = null;
      }
    });
    this.route.params.subscribe(params => {
      //console.log("PATH PARAMS: ", params);
      this.userName = params.userName;
    });
    this.route.queryParams.pipe(distinct()).subscribe(params => {
      //console.log("QUERY PARAMS: ", params);
      this.params = params;
      this.resultSetService.getPhotosByDay$().subscribe((photosByDate) => {
        this.photosByDate = photosByDate;
      });
      let q = new SearchQuery(params);
      if (q.equals(this.currentSearch)) {
        return;
      }
      this.currentSearch = q;
      this.currentSearch.userName = this.userName;
      if (this.fragment) {
        const photoIdRegEx = /photo__([0-9]+)/.exec(this.fragment);
        if (photoIdRegEx) {
          const photoId = photoIdRegEx[1];
          this.focusPhotoId = parseInt(photoId);
          const date = new Date(parseInt(photoId));
          this.currentSearch.offsetDate = parseInt(PhotosForDay.dateToDayStr(date));
          let wl = window.location;
          setTimeout(() => {
            window.history.replaceState(null, null, wl.protocol + '//' + wl.hostname + wl.pathname + wl.search);
          }, 1500);
        }
      }
      console.log('  PhotoList: query params updated: ', this.currentSearch);
      this.resultSetService.updateSearch(this.currentSearch);
    });
  }

  onSearchUpdated(query, forcedRefresh: boolean = false) {
    if (!forcedRefresh && query.equals(this.currentSearch)) {
      return;
    }
    console.log('  PhotoList: Search Updated: forcedRefresh=' + forcedRefresh, query);
    this.currentSearch = query;
    const queryParams: Params = this.currentSearch.toQueryParamHash();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams, //note, can use queryParamsHandling: "merge" to merge with existing rather than replace
    });
    this.resultSetService.updateSearch(query, forcedRefresh);
    if (this.focusPhotoId === null) {
      //Need to scroll results back to top
      try {
        this.elRef.nativeElement.getElementsByClassName('results')[0].scrollTop = 0;
      } catch (e) {
      }
    }
  }

  onPhotosEdited(editedIds) {
    console.log('onPhotosEdited got ', editedIds);
    this.focusPhotoId = editedIds ? editedIds[0] : null;
    this.onSearchUpdated(this.currentSearch, true);
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
