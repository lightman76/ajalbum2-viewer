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
    <div class="control-bar" *ngIf="currentSearch">
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
  private currentDay: string = null;
  private initialLoad = true;

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
      //console.log("     INspecting fragment: "+fragment)
      if (this.fragment) {
        if (this.currentSearch) {
          const photoIdRegEx = /photo__([0-9]+)/.exec(this.fragment);
          if (photoIdRegEx) {
            const photoId = photoIdRegEx[1];
            this.focusPhotoId = parseInt(photoId);
            const date = new Date(parseInt(photoId));
            this.currentSearch.offsetDate = parseInt(PhotosForDay.dateToDayStr(date));
            this.resultSetService.updateSearch(this.currentSearch).then((results) => {
              this.handleUpdateSearchComplete(results);
            });
            let wl = window.location;
            //window.location.replace(wl.protocol+wl.hostname+wl.pathname+wl.search)
          } else {
            this.focusPhotoId = null;
          }
        }
        const dayIdRegEx = /day__([-0-9]+)/.exec(this.fragment);
        if (dayIdRegEx) {
          const dayOffset = dayIdRegEx[1];
          //console.log("Found day ID param: "+dayOffset, this.currentDay)
          if (dayOffset === this.currentDay) {
            return;
          }
          this.currentDay = dayOffset;
          //console.log("   Updated currentDay 2 = "+this.currentDay);
          if (!this.currentSearch) {
            //console.log("  Deferring query with current day: Query not ready yet", this.currentDay);
          } else {
            //console.log("  Preparing to query with current day: "+ this.currentDay, this.currentSearch);
            let lastSearch = this.currentSearch.clone();
            this.currentSearch.offsetDate = parseInt(dayOffset.replace(/-/g, ''));
            if (!lastSearch.equals(this.currentSearch) || this.initialLoad) {
              this.resultSetService.updateSearch(this.currentSearch).then((results) => {
                this.handleUpdateSearchComplete(results);
              });
            }
          }

          let wl = window.location;
          //window.location.replace(wl.protocol+wl.hostname+wl.pathname+wl.search)
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
      if (this.currentDay && this.initialLoad) {
        q.offsetDate = parseInt(this.currentDay.replace(/-/g, ''));
      }
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
            let hash = '';
            if (this.currentDay) {
              hash = 'day__' + this.currentDay;
            }
            console.log('    After photo ID: preparing to repopulate date ID');
            this.resultSetService.getLoadedPfdForDay((this.currentDay ? this.currentDay.replace(/-/g, '') : ''), this.userName).then((pfd) => {
              if (pfd) {
                console.log('  #1 Updating state with hash ' + hash);
                window.history.replaceState(null, null, wl.protocol + '//' + wl.hostname + wl.pathname + wl.search + '#' + hash);
                (<HTMLDivElement> document.getElementsByClassName('results')[0]).scrollTop = pfd.offsetFromTop;
              }
            });

          }, 1500);
        }
      }
      console.log('  PhotoList: query params updated: ', this.currentSearch);
      this.resultSetService.updateSearch(this.currentSearch).then((results) => {
        this.handleUpdateSearchComplete(results);
      });
    });
    this.resultSetService.getCurrentPfd$().subscribe((pfd) => {
      console.log('  Updating current PFD to ' + (pfd ? pfd.forDate : 'null'));
      if (pfd && !this.currentDay && !this.initialLoad) {
        this.currentDay = '' + pfd.forDateParts[0] + '-' + this.padLeading(pfd.forDateParts[1]) + '-' + this.padLeading(pfd.forDateParts[2]);
        //console.log("   Updated currentDay 1a = "+this.currentDay, pfd.forDateParts);
        //window.location.hash = "day__"+(pfd.forDateParts[0]+"-"+pfd.forDateParts[1]+"-"+pfd.forDateParts[2]);
        let wl = window.location;
        let hash = 'day__' + this.currentDay;
        //console.log("  #2 Updating state with hash "+hash);
        window.history.replaceState(null, null, wl.protocol + '//' + wl.hostname + wl.pathname + wl.search + '#' + hash);
      } else if (pfd && (this.currentDay && this.currentDay.replace(/-/g, '') !== pfd.forDateParts.map((a) => {
        return a.toString();
      }).join('')) && !this.initialLoad) {
        this.currentDay = '' + pfd.forDateParts[0] + '-' + this.padLeading(pfd.forDateParts[1], 2) + '-' + this.padLeading(pfd.forDateParts[2], 2);
        //console.log("   Updated currentDay 1b = "+this.currentDay, pfd.forDateParts);
        //window.location.hash = "day__"+(pfd.forDateParts[0]+"-"+pfd.forDateParts[1]+"-"+pfd.forDateParts[2]);
        let wl = window.location;
        let hash = 'day__' + this.currentDay;
        //console.log("  #2 Updating state with hash "+hash);
        window.history.replaceState(null, null, wl.protocol + '//' + wl.hostname + wl.pathname + wl.search + '#' + hash);
      }
    });
  }

  onSearchUpdated(query, forcedRefresh: boolean = false, currentDay: string) {
    if (!forcedRefresh && query.equals(this.currentSearch)) {
      return;
    }
    console.log('  PhotoList: Search Updated: forcedRefresh=' + forcedRefresh, query);
    this.currentSearch = query;
    const queryParams: Params = this.currentSearch.toQueryParamHash();
    let navParams = {
      relativeTo: this.route,
      queryParams: queryParams, //note, can use queryParamsHandling: "merge" to merge with existing rather than replace
    };
    if (currentDay) {
      this.initialLoad = true;
      navParams['fragment'] = 'day__' + currentDay;
    }
    this.router.navigate([], navParams);
    this.resultSetService.updateSearch(query, forcedRefresh).then((results) => {
      this.handleUpdateSearchComplete(results);
    });
    if (this.focusPhotoId === null) {
      //Need to scroll results back to top
      try {
        this.elRef.nativeElement.getElementsByClassName('results')[0].scrollTop = 0;
      } catch (e) {
      }
    }
  }

  handleUpdateSearchComplete(results) {
    this.initialLoad = false;
    let hash = '';

    if (this.currentDay) {
      hash = 'day__' + this.currentDay;
    }
    //console.log("Preparing to retrieve current day PFD: "+this.currentDay)
    this.resultSetService.getLoadedPfdForDay((this.currentDay ? this.currentDay.replace(/-/g, '') : ''), this.currentSearch.userName).then((pfd) => {
      //console.log("   Retrieved current day PFD: "+this.currentDay, pfd)
      if (pfd) {
        //console.log("   Retrieved current day PFD found - updating scrollTop to "+pfd.offsetFromTop+": "+this.currentDay, pfd);
        (<HTMLDivElement> document.getElementsByClassName('results')[0]).scrollTop = pfd.offsetFromTop;
        //window.history.replaceState(null, null, wl.protocol + '//' + wl.hostname + wl.pathname + wl.search + "#" + hash);
      }
    });
    return results;
  }

  private padLeading(str, leading = 2) {
    str = str.toString();
    let ret = '';
    for (let i = str.length; i < leading; i++) {
      ret += '0';
    }
    ret += str;
    return ret;
  }

  onPhotosEdited(editedIds) {
    console.log('onPhotosEdited got ', editedIds);
    this.focusPhotoId = editedIds ? editedIds[0] : null;
    this.onSearchUpdated(this.currentSearch, true, this.currentDay);
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
