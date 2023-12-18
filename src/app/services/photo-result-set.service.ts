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
  private currentPfd$: BehaviorSubject<PhotosForDay>;
  private debouncedRecomputeDateHeightOffsets: any;
  private resultsAreLoading: boolean = false;
  private initialLoadUpToDate: number = null;
  private outlineNextOffsetDate: number = null;
  private outlineCurrentLoadingToDate: number = null;

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
    this.currentPfd$ = new BehaviorSubject<PhotosForDay>(null);
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

  getSearch() {
    return this.search;
  }

  //when search updated, clear prior results
  async updateSearch(inSearch: SearchQuery, forcedRefresh: boolean = false) {
    console.info('PhotoResultSet: Updating current query: ', inSearch, this.search, ' Are same? ' + (this.search && this.search.equals(inSearch)));
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
    //this.selectionService.clearSelections();
    //TODO: probably need to push out on the subjects...
    this.search = inSearch.clone();
    this.outlineNextOffsetDate = null;
    this.outlineCurrentLoadingToDate = null;
    this.initialLoadUpToDate = this.search.offsetDate;
    await this.initiateSearch();
  }

  getPhotosByDay$() {
    return this.photosByDay$;
  }

  getCurrentPfd$() {
    return this.currentPfd$;
  }

  async getLoadedPfdForDay(dateBucket, userName: string) {
    let dateBucketNum = parseInt(dateBucket);
    let pfd = this.photosByDayHash[dateBucket];
    console.log('getLoadedPfdForDay: preparing to get PFD for ' + dateBucket + ' from ', this.photosByDayList.map(x => x.forDate), pfd);
    if (pfd && pfd.photoResultsLoaded) {
      console.log('    --> getLoadedPfdForDay: Found PFD 1 -- ' + dateBucket);
      return pfd;
    }
    if (!pfd && this.photosByDayList.length > 0) {
      console.log('  getLoadedPfdForDay: checking in loaded range ', this.photosByDayList[0].forDate, dateBucketNum, this.photosByDayList[this.photosByDayList.length - 1].forDate);
      if (this.photosByDayList[0].forDate > dateBucketNum && this.photosByDayList[this.photosByDayList.length - 1].forDate < dateBucketNum) {
        console.log('   --> getLoadedPfdForDay: Found PFD 0 - already loaded range and this date isn\'t contained -- ' + dateBucketNum);
        return null;  //We've loaded through this range - the page doesn't exist
      }
    }
    if (!pfd) {
      await this.fetchResultsOutline(dateBucket);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    pfd = this.photosByDayHash[dateBucket];
    if (pfd && pfd.photoResultsLoaded) {
      console.log('    --> getLoadedPfdForDay: Found PFD 2 -- ' + dateBucket);
      return pfd;
    }

    console.log('    --> getLoadedPfdForDay: starting load of ' + dateBucketNum);

    await this.fetchStartingAtDay(dateBucketNum);
    await new Promise(resolve => setTimeout(resolve, 100)); //TODO: Why is this needed and is it variable based on connection speed?
    pfd = this.photosByDayHash[dateBucket];
    if (pfd && pfd.photoResultsLoaded) {
      console.log('    --> getLoadedPfdForDay: Found PFD 3 -- ' + dateBucket);
      return pfd;
    }
    console.log('    --> getLoadedPfdForDay: NO PFD FOUND -- ' + dateBucket);
    return null;
  }

  async getPfdForPhotoId(userName: string, photoTimeIdNum: number): Promise<PhotosForDay> {
    let photoTimeId = new Date(photoTimeIdNum);
    let photoDateCur = new Date(photoTimeIdNum / (60 * 60 * 1000) * 60 * 60 * 1000);
    let photoDateBefore = new Date(photoTimeIdNum / (60 * 60 * 1000) * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
    let photoDateAfter = new Date(photoTimeIdNum / (60 * 60 * 1000) * 60 * 60 * 1000 + 24 * 60 * 60 * 1000);

    console.log('getPfdForPhotoId: Preparing to get pfd for photoid ' + photoTimeIdNum + ' date=' + photoTimeId + ' for user ' + userName);
    try {
      let curDateBucket = parseInt(PhotosForDay.dateToDayStr(photoDateCur));
      console.log('  -->Checking cur bucket ' + curDateBucket + ' / ' + photoDateCur);
      let pfd = await this.getLoadedPfdForDay(curDateBucket, userName);
      if (pfd !== null) {
        if (pfd.getPhotoForTimeId(photoTimeIdNum)) {
          return pfd;
        }
      }

      //Wasn't in the current bucket, try the date before
      let beforeDateBucket = parseInt(PhotosForDay.dateToDayStr(photoDateBefore));
      console.log('  -->Checking before bucket ' + beforeDateBucket);
      pfd = await this.getLoadedPfdForDay(beforeDateBucket, userName);
      if (pfd !== null) {
        if (pfd.getPhotoForTimeId(photoTimeIdNum)) {
          return pfd;
        }
      }

      //Not in the current or before, try day after...
      let afterDateBucket = parseInt(PhotosForDay.dateToDayStr(photoDateAfter));
      console.log('  -->Checking after bucket ' + afterDateBucket);
      pfd = await this.getLoadedPfdForDay(afterDateBucket, userName);
      if (pfd !== null) {
        if (pfd.getPhotoForTimeId(photoTimeIdNum)) {
          return pfd;
        }
      }
    } catch (e) {
      console.error('Failed to retrieve PFD for ' + photoDateCur + ': ' + e.message, e);
      return null;
    }
  }


  async getPfdForPhotoId__OLD(userName: string, photoTimeIdNum: number): Promise<PhotosForDay> {
    let photoTimeId = new Date(photoTimeIdNum);
    console.log('getPfdForPhotoId: Preparing to get pfd for photoid ' + photoTimeIdNum + ' date=' + photoTimeId + ' for user ' + userName);
    return new Promise<PhotosForDay>((resolve, reject) => {

      let day = PhotosForDay.dateToDayStr(photoTimeId);
      let dayBucket = parseInt(day);
      console.info('getPhotoForId: Looking up day=' + day + ' in hash', this.photosByDayHash);
      let pfd = this.photosByDayHash[day];
      if (pfd) {
        if (this.photosByDayList.indexOf(pfd) === this.photosByDayList.length - 1 && this.outlineNextOffsetDate) {
          //We've loaded the last day, from the current outline results - load the next outline page
          this.fetchResultsOutline(this.outlineNextOffsetDate); //we'll just ignore the promise  and let this happen in the background
        }
      }
      console.log('  getPfdForPhotoId: pfd loaded=' + (pfd && pfd.photoResultsLoaded));
      if (pfd && pfd.photoResultsLoaded) {
        let photo = pfd.getPhotoForTimeId(photoTimeIdNum);
        if (photo) {
          resolve(pfd);
          return;
        } else {
          //didn't find the photo in that date.  It's possible the date bucket was classified to the prior day so try that
          let day = PhotosForDay.dateToDayStr(new Date(photoTimeId.getTime() - 12 * 60 * 60 * 1000));
          console.info('getPfdForPhotoId: RETRY: Looking up day=' + day + ' in hash', this.photosByDayHash);
          let pfd = this.photosByDayHash[day];
          //console.log('  getPhotoForId: pfd loaded=' + (pfd && pfd.photoResultsLoaded));
          if (pfd && pfd.photoResultsLoaded) {
            let photo = pfd.getPhotoForTimeId(photoTimeIdNum);
            if (photo) {
              resolve(pfd);
              return;
            }
          }
        }
      }
      //let dayTmp = PhotosForDay.dateToDayStr(new Date(photoTimeId.getTime() - 12 * 60 * 60 * 1000));
      let dayTmp = PhotosForDay.dateToDayStr(photoTimeId);
      let earlyPhotoTimeId = parseInt(dayTmp);
      console.log('  getPfdForPhotoId: Preparing to fetch starting at ' + earlyPhotoTimeId);
      let sub = this.photosByDay$.subscribe((pfds) => {
        setTimeout(() => {
          console.log('    getPfdForPhotoId: Got photosByDay$ update: ', pfds);
          let pfd = pfds.find((tmp) => {
            return tmp.forDate === dayBucket;
          });
          if (pfd) {
            console.log('  getPfdForPhotoId: retrying: pfd loaded=' + (pfd && pfd.photoResultsLoaded) + ' for day ' + dayTmp);
            if (pfd) {
              try {
                sub.unsubscribe();
              } catch (e) {
              }
              let sub2 = pfd.getPhotoList$().subscribe((photos) => {
                setTimeout(() => {
                  if (pfd && pfd.photoResultsLoaded) {
                    let photo = pfd.getPhotoForTimeId(photoTimeIdNum);
                    if (photo) {
                      console.log('  ##### getPfdForPhotoId: load for getPfdForPhotoId  RESOLVING: ' + pfd.forDate, photoTimeId);
                      resolve(pfd);
                    } else {
                      console.log('getPfdForPhotoId: didn\'t find photo id', photoTimeId, earlyPhotoTimeId);
                      //reject('Photo not found');

                      //TODO: need to check the normal day (vs offset day)

                    }
                    try {
                      sub2.unsubscribe();
                    } catch (e) {
                    }
                    return;
                  }
                });
              });
              return;
            }
          }
          console.log('    getPfdForPhotoId: Updated photosForDay list doesn\'t contain target date ' + photoTimeId, pfds);
          pfd = pfds.find((tmp) => {
            return tmp.forDate === earlyPhotoTimeId;
          });
          if (pfd) {
            console.log('  getPfdForPhotoId: retrying2: pfd loaded=' + (pfd && pfd.photoResultsLoaded) + ' for day ' + earlyPhotoTimeId);
            try {
              sub.unsubscribe();
            } catch (e) {
            }
            let sub2 = pfd.getPhotoList$().subscribe((photos) => {
              setTimeout(() => {
                if (pfd && pfd.photoResultsLoaded) {
                  console.log('  ##### getPfdForPhotoId: load for getPfdForPhotoId  RESOLVING: ' + pfd.forDate);
                  let photo = pfd.getPhotoForTimeId(photoTimeIdNum);
                  if (photo) {
                    resolve(pfd);
                  } else {
                    console.log('getPfdForPhotoId: didn\'t find photo id2', photoTimeId, earlyPhotoTimeId);
                    reject('Photo not found');
                  }
                  try {
                    sub2.unsubscribe();
                  } catch (e) {
                  }
                  return;
                }
              });
            });
          }
        });
      });
      this.fetchStartingAtDay(earlyPhotoTimeId);
    });

  }

  async getPhotoForId(userName: string, photoTimeIdNum: number): Promise<Photo> {
    let photoTimeId = new Date(photoTimeIdNum);
    console.log('getPhotoForId: Preparing to getphoto ' + photoTimeIdNum + ' date=' + photoTimeId + ' for user ' + userName);

    let pfd = await this.getPfdForPhotoId(userName, photoTimeIdNum);
    console.log('Got PFD: ', pfd);
    if (pfd) {
      let photo = pfd.getPhotoForTimeId(photoTimeIdNum);
      if (photo) {
        return photo;
      }
    }
    console.error('getPhotoForId: didn\'t find photo id: ' + photoTimeIdNum);
    throw new Error('Photo not found');
  }

  async getPhotosBetween(userName: string, photoTimeId1: number, photoTimeId2: number) {
    let startId = photoTimeId1;
    let endId = photoTimeId2;
    if (endId < startId) {
      startId = photoTimeId2;
      endId = photoTimeId1;
    }

    let startPfd = await this.getPfdForPhotoId(userName, startId);
    let endPfd = await this.getPfdForPhotoId(userName, endId);

    let photos: Array<Photo> = [];

    let endPhotos = endPfd.getPhotoList$().getValue();
    var foundStart = false;
    endPhotos.forEach((p) => {
      if (p.time_id <= endId && p.time_id >= startId) {
        photos.push(p);
      }
      if (!foundStart && p.time_id === startId) {
        foundStart = true;
      }
    });

    if (startPfd !== endPfd && !foundStart) {
      let curPfdIdx = this.photosByDayList.indexOf(endPfd);
      if (curPfdIdx >= 0) {
        while (!foundStart && curPfdIdx < this.photosByDayList.length) {
          curPfdIdx += 1;
          let curPfd = this.photosByDayList[curPfdIdx];
          curPfd.getPhotoList$().getValue().forEach((p) => {
            if (p.time_id <= endId && p.time_id >= startId) {
              photos.push(p);
            }
            if (!foundStart && p.time_id === startId) {
              foundStart = true;
            }
          });
        }
      }
    }

    return photos;
  }

  async getFuturePhotoFromId(photoTimeIdNum: number): Promise<Photo> {
    let photoTimeId = new Date(photoTimeIdNum);
    console.log('getFuturePhotoForId: Preparing to getphoto ' + photoTimeIdNum + ' date=' + photoTimeId);

    let pfd = await this.getPfdForPhotoId(this.search.userName, photoTimeIdNum);
    if (pfd) {
      let photo = pfd.getFuturePhotoFromId(photoTimeIdNum);
      if (photo) {
        return photo;
      } else {
        var idx = this.photosByDayList.indexOf(pfd);
        if (idx > 0) {
          var nextDayPfd = this.photosByDayList[idx - 1];
          nextDayPfd = await this.getLoadedPfdForDay(nextDayPfd.forDate, this.search.userName);
          return nextDayPfd.getLastPhoto();
        }
        return null;
      }
    }
    console.log('getFuturePhotoFromId: didn\'t find photo id');
    throw new Error('Photo not found');
  }

  async getFuturePhotoFromId__OLD(photoTimeIdNum: number): Promise<Photo> {
    let photoTimeId = new Date(photoTimeIdNum);
    console.log('getFuturePhotoForId: Preparing to getphoto ' + photoTimeIdNum + ' date=' + photoTimeId);

    let pfd = await this.getPfdForPhotoId(this.search.userName, photoTimeIdNum);
    if (pfd) {
      let photo = pfd.getFuturePhotoFromId(photoTimeIdNum);
      if (photo) {
        return photo;
      } else {
        return new Promise<Photo>((resolve, reject) => {
          var idx = this.photosByDayList.indexOf(pfd);
          if (idx > 0) {
            var nextDayPfd = this.photosByDayList[idx - 1];
            if (nextDayPfd && !nextDayPfd.photoResultsLoaded) {
              console.log('  ##### getFuturePhotoFromId: Awaiting load for nextDayPfd: ' + nextDayPfd.forDate);
              let sub = this.photosByDay$.subscribe((pfds) => {
                setTimeout(() => {
                  try {
                    sub.unsubscribe();
                  } catch (e) {
                  }
                  var nextDayPfd = this.photosByDayList[idx - 1];
                  console.log('  ##### getFuturePhotoFromId: load for nextDayPfd got subscription update for: ' + nextDayPfd.forDate + '  photoResultsLoaded=' + nextDayPfd.photoResultsLoaded, nextDayPfd);
                  //TODO: now subscribe and wait on photoList$ and keep checking the results loaded
                  let sub2 = nextDayPfd.getPhotoList$().subscribe((photos) => {
                    if (nextDayPfd && nextDayPfd.photoResultsLoaded) {
                      console.log('  ##### getFuturePhotoFromId: load for nextDayPfd  RESOLVING: ' + nextDayPfd.forDate);
                      resolve(nextDayPfd.getLastPhoto());
                      sub2.unsubscribe();
                    }
                  });
                });
              });
              this.fetchStartingAtDay(nextDayPfd.forDate);
              return;
            } else {
              if (nextDayPfd) {
                resolve(nextDayPfd.getLastPhoto());
              } else {
                reject('Beginning of results');
              }
            }
          }
          console.log('getFuturePhotoFromId: didn\'t find photo id 2');
          reject('Photo not found');
        });
      }
    }
    console.log('getFuturePhotoFromId: didn\'t find photo id');
    throw new Error('Photo not found');
  }

  async getPastPhotoFromId(photoTimeIdNum: number): Promise<Photo> {
    let photoTimeId = new Date(photoTimeIdNum);
    console.log('getPastPhotoForId: Preparing to getphoto ' + photoTimeIdNum + ' date=' + photoTimeId);

    let pfd = await this.getPfdForPhotoId(this.search.userName, photoTimeIdNum);
    if (pfd) {
      let photo = pfd.getPastPhotoFromId(photoTimeIdNum);
      if (photo) {
        return photo;
      } else {
        var idx = this.photosByDayList.indexOf(pfd);
        if (idx >= 0 && idx < this.photosByDayList.length) {
          var prevDayPfd = this.photosByDayList[idx + 1];
          if (!prevDayPfd) {
            return null;
          }
          prevDayPfd = await this.getLoadedPfdForDay(prevDayPfd.forDate, this.search.userName);
          return prevDayPfd ? prevDayPfd.getFirstPhoto() : null;
        }
        return null;
      }
    }
    console.log('getPastPhotoFromId: didn\'t find photo id');
    throw new Error('Photo not found');
  }

  async getPastPhotoFromId__OLD(photoTimeIdNum: number): Promise<Photo> {
    let photoTimeId = new Date(photoTimeIdNum);
    console.log('getPastPhotoForId: Preparing to getphoto ' + photoTimeIdNum + ' date=' + photoTimeId);

    let pfd = await this.getPfdForPhotoId(this.search.userName, photoTimeIdNum);
    if (pfd) {
      let photo = pfd.getPastPhotoFromId(photoTimeIdNum);
      if (photo) {
        return photo;
      } else {
        return new Promise<Photo>((resolve, reject) => {
          var idx = this.photosByDayList.indexOf(pfd);
          if (idx >= 0 && idx < this.photosByDayList.length) {
            var prevDayPfd = this.photosByDayList[idx + 1];
            if (prevDayPfd && !prevDayPfd.photoResultsLoaded) {
              let sub = this.photosByDay$.subscribe((pfds) => {
                setTimeout(() => {
                  var prevDayPfd = this.photosByDayList[idx + 1];
                  try {
                    sub.unsubscribe();
                  } catch (e) {
                  }
                  console.log('  ##### getPastPhotoFromId: load for prevDayPfd got subscription update for: ' + prevDayPfd.forDate + '  photoResultsLoaded=' + prevDayPfd.photoResultsLoaded, prevDayPfd);
                  //TODO: now subscribe and wait on photoList$ and keep checking the results loaded
                  let sub2 = prevDayPfd.getPhotoList$().subscribe((photos) => {
                    if (prevDayPfd && prevDayPfd.photoResultsLoaded) {
                      console.log('  ##### getPastPhotoFromId: load for nextDayPfd  RESOLVING: ' + prevDayPfd.forDate);
                      resolve(prevDayPfd.getFirstPhoto());
                      sub2.unsubscribe();
                    }
                  });
                });
              });
              this.fetchStartingAtDay(prevDayPfd.forDate);
            } else {
              if (prevDayPfd) {
                resolve(prevDayPfd.getFirstPhoto());
              } else {
                reject('End of results');
              }
            }
          }
        });
      }
    }
    console.log('getPastPhotoFromId: didn\'t find photo id');
    throw new Error('Photo not found');
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
    let curPageOffsetPoint = scrollOffset + 0.5 * vpHeight;
    let rangeBottom = scrollOffset + 3 * vpHeight;
    //console.log("    Reprocessing range=" + rangeTop + "/" + rangeBottom);


    this.photosByDayList.forEach((pfd, idx) => {
      if (!(
        pfd.offsetFromTop + pfd.getDisplayHeight$().getValue() < rangeTop ||
        pfd.offsetFromTop > rangeBottom
      )) {
        //check if it's the current page
        if (pfd.displayHeight$.getValue() > 200 && pfd.offsetFromTop < curPageOffsetPoint && pfd.offsetFromTop + pfd.displayHeight$.getValue() >= curPageOffsetPoint) {
          if (this.currentPfd$.getValue() !== pfd) {
            console.log('   Updating current page: ' + pfd.forDate + ' - offsetTop=' + pfd.offsetFromTop + ' < ' + curPageOffsetPoint + ' < ' + (pfd.offsetFromTop + pfd.displayHeight$.getValue()));
            this.currentPfd$.next(pfd);
          }
        }
        //It's in the view area
        pfd.dateInViewRange = true;
        if (this.photosByDayList.length === idx + 1 && this.outlineNextOffsetDate) {
          //We've loaded the last day, from the current outline results - load the next outline page
          this.fetchResultsOutline(this.outlineNextOffsetDate); //we'll just ignore the promise  and let this happen in the background
        }
        //console.log("      Checking " + pfd.forDate + " results loaded=" + pfd.photoResultsLoaded + " resultsLoading=" + this.resultsAreLoading + " offsetFromTop=" + pfd.offsetFromTop + " height=" + pfd.getDisplayHeight$().getValue())
        if (!pfd.photoResultsLoaded && !this.resultsAreLoading) {
          console.log('      Preparing to load for ' + pfd.forDate + ' results loaded=' + pfd.photoResultsLoaded + ' resultsLoading=' + this.resultsAreLoading);
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

  private async fetchStartingAtDay(offsetDate: number) {
    console.log('  FETCH at date=' + offsetDate, this.search);
    return new Promise((resolve, reject) => {
      this.photoService.getSearchResults(this.search, offsetDate).subscribe((results) => {
        this.parseResults(results);
        resolve({});
      });
    });
  }

  private async fetchResultsOutline(offsetDate: number) {
    if (this.outlineCurrentLoadingToDate != null && this.outlineCurrentLoadingToDate === offsetDate) {
      return;
    } //Already in the process of loading
    this.outlineCurrentLoadingToDate = offsetDate;
    console.log('  FETCH OUTLINE at date=' + offsetDate);
    return new Promise<boolean>((resolve, reject) => {
      this.photoService.getSearchDateOutline(this.search, offsetDate).subscribe(async (results) => {
        this.parseOutlineResults(results);
        this.recomputeDateHeightOffsets();
        this.recomputePagesInViewForOffset(this.scrollOffset$.getValue());
        if (this.initialLoadUpToDate) {
          let earliestDate = this.photosByDayList[this.photosByDayList.length - 1].forDate;
          let loadToDate = this.initialLoadUpToDate;
          console.log('   ## Looking for initial load date of ' + loadToDate + '.  Currently at ' + earliestDate + '.  Next offset date=' + this.outlineNextOffsetDate);
          if (earliestDate > loadToDate && this.outlineNextOffsetDate) {
            console.log('   #### Fetching outline for Next offset date=' + this.outlineNextOffsetDate);
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
    this.outlineNextOffsetDate = results.next_offset_date;
    results.result_count_by_date.forEach((dayOutline) => {
      //let parsedDate = new Date(dayOutline.date + "T00:00:00");
      let parsedDayBucket = dayOutline.date.replace(/-/g, '');
      //let parsedDate = new Date(parsedDateW.getTime())
      let photosByDay = this.getPhotosForDay(parsedDayBucket, processedDates);
      photosByDay.getPhotoCount$().next(dayOutline.num_items);
    });
  }

  private parseResults(results: ISearchResultsGroup) {
    let processedDates = {};
    results.photos.forEach((ip) => {
      let photo = Photo.fromIPhoto(ip);
      let localTime = new Date(photo.time.getTime());
      let bucketTime = photo.date_bucket;
      //console.log('processing date bucket ' + bucketTime, ip);
      let photosByDay = this.getPhotosForDay(bucketTime, processedDates);
      photosByDay.addPhoto(photo);
    });
    this.resultsAreLoading = false;
  }

  private getPhotosForDay(day, processedDates: any): PhotosForDay {
    let pfd = this.photosByDayHash[day];
    console.log('    Looking up Photos For Day ' + day + '.  Found existing? ' + (pfd != null));
    if (pfd == null) {
      pfd = new PhotosForDay(day, this);
      let oldList = this.photosByDayList;
      this.photosByDayList = oldList.slice();
      this.photosByDayList.push(pfd);
      this.photosByDayHash[day] = pfd;
      this.photosByDayList.sort((a, b) => {
        return b.forDate - a.forDate;
      });
      this.photosByDay$.next(this.photosByDayList);
      this.searchSpecificSubscriptions.push(pfd.getDisplayHeight$().pipe(distinct()).subscribe((newHeight) => {
        this.debouncedRecomputeDateHeightOffsets();
      }));

    } else {
      if (processedDates[day] == null) {
        //console.log("    Found day already existing.  Refreshing results for " + day);
        //We haven't processed this date yet in this results batch, so
        //existing results are old, wipe it out before returning
        processedDates[day] = true;
        pfd.clearList();
        pfd.photoResultsLoaded = false;
      }
    }
    return pfd;
  }

}
