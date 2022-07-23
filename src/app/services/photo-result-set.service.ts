import {PhotoService} from './photo.service';
import {PhotosForDay} from '../helper/photos-for-day';
import {SearchQuery} from './helper/search-query';
import {ISearchResultsGroup} from './helper/i-search-results-group';
import {Injectable} from '@angular/core';
import {Photo} from '../helper/photo';
import {BehaviorSubject, Subscription} from 'rxjs';
import {ISearchDateOutlineResult} from './helper/i-search-date-outline-result';
import {RectangleDimensions} from './helper/rectangle-dimensions';
import {distinct} from 'rxjs/operators';
import * as _ from 'lodash';
import {SelectionService} from './selection.service';

@Injectable()
export class PhotoResultSetService {
  private photosByDayList: Array<PhotosForDay>;
  private photosByDayHash: { [key: string]: PhotosForDay };
  private search: SearchQuery;
  private searchSpecificSubscriptions: Array<Subscription>;

  private photosByDay$: BehaviorSubject<Array<PhotosForDay>>;

  private viewerWidth$: BehaviorSubject<number>;
  private viewerHeight$: BehaviorSubject<number>;
  private thumbnailDims$: BehaviorSubject<RectangleDimensions>;
  private scrollOffset$: BehaviorSubject<number>;
  private debouncedRecomputeDateHeightOffsets: any;
  private resultsAreLoading: boolean = false;
  private initialLoadUpToDate: string = null;
  private outlineNextOffsetDate = null;

  constructor(
    private photoService: PhotoService,
    private selectionService: SelectionService,
  ) {
    this.photosByDayList = [];
    this.photosByDayHash = {};
    this.photosByDay$ = new BehaviorSubject<Array<PhotosForDay>>(this.photosByDayList);
    this.viewerWidth$ = new BehaviorSubject<number>(window.innerWidth);
    this.viewerHeight$ = new BehaviorSubject<number>(window.innerHeight);
    this.thumbnailDims$ = new BehaviorSubject<RectangleDimensions>(new RectangleDimensions(270, 270));
    this.scrollOffset$ = new BehaviorSubject<number>(0);
    this.searchSpecificSubscriptions = [];
    this.scrollOffset$.subscribe((offset) => {
      this.recomputePagesInViewForOffset(offset);
    });
    this.debouncedRecomputeDateHeightOffsets = _.debounce(this.recomputeDateHeightOffsets, 100, {
      leading: true,
      trailing: true
    });
    window.addEventListener("resize", () => {
      this.recomputeThumbSize();
      this.viewerWidth$.next(window.innerWidth);
    });
    this.recomputeThumbSize();
  }

  recomputeThumbSize() {
    if (window.innerWidth < 810) {
      const size = Math.floor((window.innerWidth) / 3.0);
      this.thumbnailDims$.next(new RectangleDimensions(size, size));
    } else {
      this.thumbnailDims$.next(new RectangleDimensions(260, 260));
    }
  }

  //when search updated, clear prior results
  async updateSearch(inSearch: SearchQuery, forcedRefresh: boolean = false) {
    //console.info("PhotoResultSet: Updating current query: ",inSearch, this.search, " Are same? "+(this.search && this.search.equals(inSearch)))
    if (!forcedRefresh && this.search && this.search.equals(inSearch)) {
      return;
    }
    console.info('  PhotoResultSet: It\'s a new query/forced refresh - actually run: ', forcedRefresh, inSearch, this.search);
    this.searchSpecificSubscriptions.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch (e) {
      }
    });
    this.searchSpecificSubscriptions = [];
    this.photosByDayList = [];
    this.photosByDayHash = {};
    this.photosByDay$.next(this.photosByDayList);
    this.selectionService.clearSelections();
    //TODO: probably need to push out on the subjects...
    this.search = inSearch.clone();
    this.initialLoadUpToDate = this.search.offsetDate;
    await this.initiateSearch();
  }

  getPhotosByDay$() {
    return this.photosByDay$;
  }

  async getPhotoForId(userName: string, photoTimeIdNum: number): Promise<Photo> {
    let photoTimeId = new Date(photoTimeIdNum);
    console.log('getPhotoForId: Preparing to getphoto ' + photoTimeIdNum + ' date=' + photoTimeId + ' for user ' + userName);
    return new Promise<Photo>((resolve, reject) => {

      let day = PhotosForDay.dateToDayStr(photoTimeId);
      let pfd = this.photosByDayHash[day];
      console.log('  getPhotoForId: pfd loaded=' + (pfd && pfd.photoResultsLoaded));
      if (pfd && pfd.photoResultsLoaded) {
        resolve(pfd.getPhotoForTimeId(photoTimeIdNum));
      } else {
        this.fetchStartingAtDay(photoTimeId);
        let sub = this.photosByDay$.subscribe((pfds) => {
          let day = PhotosForDay.dateToDayStr(photoTimeId);
          let pfd = this.photosByDayHash[day];
          if (pfd) {
            console.log("  getPhotoForId: retrying: pfd loaded=" + (pfd && pfd.photoResultsLoaded) + " for day " + day)
            setTimeout(() => {
              if (pfd && pfd.photoResultsLoaded) {
                sub.unsubscribe();
                let photo = pfd.getPhotoForTimeId(photoTimeIdNum);
                if (photo) {
                  resolve(photo);
                } else {
                  reject("Photo not found");
                }
              }
            }, 100);
          }
        });
        return null;
      }
    });
  }

  getFuturePhotoFromId(photoTimeIdNum: number): Promise<Photo> {
    let photoTimeId = new Date(photoTimeIdNum);
    console.log("getFuturePhotoForId: Preparing to getphoto " + photoTimeIdNum + " date=" + photoTimeId);
    return new Promise<Photo>((resolve, reject) => {

      let day = PhotosForDay.dateToDayStr(photoTimeId);
      let pfd = this.photosByDayHash[day];
      console.log("  getPhotoForId: pfd loaded=" + (pfd && pfd.photoResultsLoaded))
      if (pfd && pfd.photoResultsLoaded) {
        let photo = pfd.getFuturePhotoFromId(photoTimeIdNum);
        if (photo) {
          resolve(photo);
        } else {
          //TODO - find future day and return last photo
          //reject("Photo not found");
          var idx = this.photosByDayList.indexOf(pfd);
          if (idx > 0) {
            var nextDayPfd = this.photosByDayList[idx - 1];
            resolve(nextDayPfd.getLastPhoto());

            if (nextDayPfd && !nextDayPfd.photoResultsLoaded) {
              this.fetchStartingAtDay(nextDayPfd.forDate);
              var sub = this.photosByDay$.subscribe((pfds) => {
                let nextDayPfd = this.photosByDayList[idx - 1];
                resolve(nextDayPfd.getLastPhoto());
                sub.unsubscribe();
              });
            } else {
              if (nextDayPfd) {
                resolve(nextDayPfd.getLastPhoto());
              } else {
                reject("Beginning of results")
              }
            }

          }
        }
      } else {
        this.fetchStartingAtDay(photoTimeId);
        let sub = this.photosByDay$.subscribe((pfds) => {
          let day = PhotosForDay.dateToDayStr(photoTimeId);
          let pfd = this.photosByDayHash[day];
          if (pfd) {
            console.log("  getPhotoForId: retrying: pfd loaded=" + (pfd && pfd.photoResultsLoaded) + " for day " + day)
            setTimeout(() => {
              if (pfd && pfd.photoResultsLoaded) {
                sub.unsubscribe();
                let photo = pfd.getFuturePhotoFromId(photoTimeIdNum);
                if (photo) {
                  resolve(photo);
                } else {
                  //TODO - find future day and return last photo
                  //reject("Photo not found");
                }
              }
            }, 100);
          }
        });
        return null;
      }
    });
  }

  getPastPhotoFromId(photoTimeIdNum: number): Promise<Photo> {
    let photoTimeId = new Date(photoTimeIdNum);
    console.log("getFuturePhotoForId: Preparing to getphoto " + photoTimeIdNum + " date=" + photoTimeId);
    return new Promise<Photo>((resolve, reject) => {

      let day = PhotosForDay.dateToDayStr(photoTimeId);
      let pfd = this.photosByDayHash[day];
      console.log("  getPhotoForId: pfd loaded=" + (pfd && pfd.photoResultsLoaded))
      if (pfd && pfd.photoResultsLoaded) {
        let photo = pfd.getPastPhotoFromId(photoTimeIdNum);
        if (photo) {
          resolve(photo);
        } else {
          //TODO - find past day and return first photo
          //reject("Photo not found");
          var idx = this.photosByDayList.indexOf(pfd);
          if (idx >= 0 && idx < this.photosByDayList.length) {
            var prevDayPfd = this.photosByDayList[idx + 1];
            if (prevDayPfd && !prevDayPfd.photoResultsLoaded) {
              this.fetchStartingAtDay(prevDayPfd.forDate);
              let sub = this.photosByDay$.subscribe((pfds) => {
                var prevDayPfd = this.photosByDayList[idx + 1];
                resolve(prevDayPfd.getFirstPhoto());
                sub.unsubscribe();
              });
            } else {
              if (prevDayPfd) {
                resolve(prevDayPfd.getFirstPhoto());
              } else {
                reject("End of results")
              }
            }
          }
        }
      } else {
        this.fetchStartingAtDay(photoTimeId);
        let sub = this.photosByDay$.subscribe((pfds) => {
          let day = PhotosForDay.dateToDayStr(photoTimeId);
          let pfd = this.photosByDayHash[day];
          if (pfd) {
            console.log("  getPhotoForId: retrying: pfd loaded=" + (pfd && pfd.photoResultsLoaded) + " for day " + day)
            setTimeout(() => {
              if (pfd && pfd.photoResultsLoaded) {
                sub.unsubscribe();
                let photo = pfd.getPastPhotoFromId(photoTimeIdNum);
                if (photo) {
                  resolve(photo);
                } else {
                  //TODO - find past day and return first photo
                  //reject("Photo not found");
                }
              }
            }, 100);
          }
        });
        return null;
      }
    });
  }


  recomputeDateHeightOffsets() {
    let bottomOfLast = 0;
    //console.log("  Recompute height offsets");
    this.photosByDayList.forEach((pfd, idx) => {
      pfd.offsetFromTop = bottomOfLast;
      bottomOfLast = pfd.offsetFromTop + pfd.getDisplayHeight$().getValue();
      //console.log("    " + pfd.forDate.getFullYear() + (pfd.forDate.getMonth() + 1) + pfd.forDate.getDate() + " " + pfd.offsetFromTop + " height=" + pfd.getDisplayHeight$().getValue() + " bottomOfLast=" + bottomOfLast)
    });
  }

  recomputePagesInViewForOffset(scrollOffset) {
    //console.log("  Reprocessing offset " + scrollOffset);
    let vpHeight = this.viewerHeight$.getValue();
    let rangeTop = scrollOffset - 2 * vpHeight;
    let rangeBottom = scrollOffset + 3 * vpHeight;
    //console.log("    Reprocessing range=" + rangeTop + "/" + rangeBottom);


    this.photosByDayList.forEach((pfd) => {
      if (!(
        pfd.offsetFromTop + pfd.getDisplayHeight$().getValue() < rangeTop ||
        pfd.offsetFromTop > rangeBottom
      )) {
        //It's in the view area
        pfd.dateInViewRange = true;
        //console.log("      Checking " + pfd.forDate + " results loaded=" + pfd.photoResultsLoaded + " resultsLoading=" + this.resultsAreLoading + " offsetFromTop=" + pfd.offsetFromTop + " height=" + pfd.getDisplayHeight$().getValue())
        if (!pfd.photoResultsLoaded && !this.resultsAreLoading) {
          console.log("      Preparing to load for " + pfd.forDate + " results loaded=" + pfd.photoResultsLoaded + " resultsLoading=" + this.resultsAreLoading)
          this.fetchStartingAtDay(pfd.forDate);
          this.resultsAreLoading = true;
          //since this can return multiple days, we'll stop here
          //may want to trigger this again after the results load...
        }
      } else {
        //outside view area
        pfd.dateInViewRange = false;
      }
    });
  }

  getViewerWidth$() {
    return this.viewerWidth$;
  }

  getThumbnailDims$() {
    return this.thumbnailDims$;
  }

  getScrollOffset$() {
    return this.scrollOffset$;
  }

  private async initiateSearch() {
    await this.fetchResultsOutline(null);

  }

  private fetchStartingAtDay(offsetDate: Date) {
    console.log('  FETCH at date=' + offsetDate);
    this.photoService.getSearchResults(this.search, offsetDate).subscribe((results) => {
      this.parseResults(results);
    });
  }

  private async fetchResultsOutline(offsetDate: Date) {
    console.log('  FETCH OUTLINE at date=' + offsetDate);
    return new Promise<boolean>((resolve, reject) => {
      this.photoService.getSearchDateOutline(this.search, offsetDate).subscribe(async (results) => {
        this.parseOutlineResults(results);
        this.recomputePagesInViewForOffset(this.scrollOffset$.getValue());
        if (this.initialLoadUpToDate) {
          let earliestDate = this.photosByDayList[this.photosByDayList.length - 1].forDate;
          let loadToDate = new Date(this.initialLoadUpToDate);
          console.log('   ## Looking for initial load date of ' + loadToDate + '.  Currently at ' + earliestDate + '.  Next offset date=' + this.outlineNextOffsetDate);
          if (earliestDate > loadToDate) {
            await this.fetchResultsOutline(this.outlineNextOffsetDate);
          } else {
            resolve(true);
          }
        } else {
          resolve(true);
        }
      });
    });
  }

  private parseOutlineResults(results: ISearchDateOutlineResult) {
    let processedDates = {};
    this.outlineNextOffsetDate = new Date(results.next_offset_date);
    results.result_count_by_date.forEach((dayOutline) => {
      let parsedDate = new Date(dayOutline.date + "T00:00:00");
      //let parsedDate = new Date(parsedDateW.getTime())
      let photosByDay = this.getPhotosForDay(parsedDate, processedDates);
      photosByDay.getPhotoCount$().next(dayOutline.num_items);
    });
  }

  private parseResults(results: ISearchResultsGroup) {
    let processedDates = {};
    results.photos.forEach((ip) => {
      let photo = Photo.fromIPhoto(ip);
      let localTime = new Date(photo.time.getTime())
      let photosByDay = this.getPhotosForDay(localTime, processedDates);
      photosByDay.addPhoto(photo);
    });
    this.resultsAreLoading = false;
  }

  private getPhotosForDay(date: Date, processedDates: any): PhotosForDay {
    let day = PhotosForDay.dateToDayStr(date);
    let pfd = this.photosByDayHash[day];
    //console.log("    Looking up Photos For Day " + day + ".  Found existing? " + (pfd != null));
    if (pfd == null) {
      pfd = new PhotosForDay(date, this);
      let oldList = this.photosByDayList;
      this.photosByDayList = oldList.slice();
      this.photosByDayList.push(pfd);
      this.photosByDayHash[day] = pfd;
      this.photosByDayList.sort((a, b) => {
        return b.forDate.getTime() - a.forDate.getTime();
      });
      this.photosByDay$.next(this.photosByDayList);
      this.searchSpecificSubscriptions.push(pfd.getDisplayHeight$().pipe(distinct()).subscribe((newHeight) => {
        this.debouncedRecomputeDateHeightOffsets();
      }));

    } else {
      if (processedDates[day] == null) {
        console.log("    Found day already existing.  Refreshing results for " + day);
        //We haven't processed this date yet in this results batch, so
        //existing results are old, wipe it out before returning
        processedDates[day] = true;
        pfd.clearList();
      }
    }
    return pfd;
  }

}
