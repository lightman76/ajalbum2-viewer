import {PhotoService} from "./photo.service";
import {PhotosForDay} from "../helper/photos-for-day";
import {SearchQuery} from "./helper/search-query";
import {ISearchResultsGroup} from "./helper/i-search-results-group";
import {Injectable} from "@angular/core";
import {Photo} from "../helper/photo";
import {BehaviorSubject, Subscription} from "rxjs";
import {ISearchDateOutlineResult} from "./helper/i-search-date-outline-result";
import {RectangleDimensions} from "./helper/rectangle-dimensions";
import {distinct} from "rxjs/operators";
import * as _ from "lodash";

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

  constructor(
    private photoService: PhotoService,
  ) {
    this.photosByDayList = [];
    this.photosByDayHash = {};
    this.photosByDay$ = new BehaviorSubject<Array<PhotosForDay>>(this.photosByDayList);
    this.viewerWidth$ = new BehaviorSubject<number>(window.innerWidth - 20);
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
  }

  //when search updated, clear prior results
  updateSearch(inSearch: SearchQuery) {
    //console.info("PhotoResultSet: Updating current query: ",inSearch, this.search, " Are same? "+(this.search && this.search.equals(inSearch)))
    if (this.search && this.search.equals(inSearch)) return;
    //console.info("  PhotoResultSet: It's a new query - actually run: ",inSearch)
    this.searchSpecificSubscriptions.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch (e) {
      }
    });
    this.searchSpecificSubscriptions = [];
    this.photosByDayList = [];
    this.photosByDayHash = {};
    //TODO: probably need to push out on the subjects...
    this.search = inSearch.clone();
    this.initiateSearch();
  }

  getPhotosByDay$() {
    return this.photosByDay$;
  }

  getPhotoForId(photoTimeIdNum: number): Promise<Photo> {
    let photoTimeId = new Date(photoTimeIdNum * 1000); //TEMPORARY - multiply by 1000 due to error in ruby side usings seconds instead of ms.
    console.log("getPhotoForId: Preparing to getphoto " + photoTimeIdNum + " date=" + photoTimeId);
    return new Promise<Photo>((resolve, reject) => {

      let day = PhotosForDay.dateToDayStr(photoTimeId);
      let pfd = this.photosByDayHash[day];
      console.log("  getPhotoForId: pfd loaded=" + (pfd && pfd.photoResultsLoaded))
      if (pfd && pfd.photoResultsLoaded) {
        resolve(pfd.getPhotoForTimeId(photoTimeIdNum));
      } else {
        this.fetchStartingAtDay(photoTimeId);
        let sub = this.photosByDay$.subscribe((pfds) => {
          let day = PhotosForDay.dateToDayStr(photoTimeId);
          let pfd = this.photosByDayHash[day];
          console.log("  getPhotoForId: retrying: pfd loaded=" + (pfd && pfd.photoResultsLoaded))
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
          });
        });
        return null;
      }
    });
  }


  recomputeDateHeightOffsets() {
    let bottomOfLast = 0;
    console.log("  Recompute height offsets");
    this.photosByDayList.forEach((pfd, idx) => {
      pfd.offsetFromTop = bottomOfLast;
      bottomOfLast = pfd.offsetFromTop + pfd.getDisplayHeight$().getValue();
      console.log("    " + pfd.forDate.getFullYear() + (pfd.forDate.getMonth() + 1) + pfd.forDate.getDate() + " " + pfd.offsetFromTop + " height=" + pfd.getDisplayHeight$().getValue() + " bottomOfLast=" + bottomOfLast)
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

  private initiateSearch() {
    this.fetchResultsOutline(null);

  }

  private fetchStartingAtDay(offsetDate: Date) {
    console.log("  FETCH at date=" + offsetDate);
    this.photoService.getSearchResults(this.search, offsetDate).subscribe((results) => {
      this.parseResults(results);
    });
  }

  private fetchResultsOutline(offsetDate: Date) {
    console.log("  FETCH OUTLINE at date=" + offsetDate);
    this.photoService.getSearchDateOutline(this.search, offsetDate).subscribe((results) => {
      this.parseOutlineResults(results);
      this.recomputePagesInViewForOffset(this.scrollOffset$.getValue());
    });
  }

  private parseOutlineResults(results: ISearchDateOutlineResult) {
    let processedDates = {};
    results.result_count_by_date.forEach((dayOutline) => {
      let parsedDateW = new Date(dayOutline.date);
      let offsetMin = parsedDateW.getTimezoneOffset();
      let parsedDate = new Date(parsedDateW.getTime() + offsetMin * 60 * 1000)
      let photosByDay = this.getPhotosForDay(parsedDate, processedDates);
      photosByDay.getPhotoCount$().next(dayOutline.num_items);
    });
  }

  private parseResults(results: ISearchResultsGroup) {
    let processedDates = {};
    results.photos.forEach((ip) => {
      let photo = Photo.fromIPhoto(ip);
      let offsetMin = photo.time.getTimezoneOffset();
      let localTime = new Date(photo.time.getTime() + offsetMin * 60 * 1000)
      let photosByDay = this.getPhotosForDay(localTime, processedDates);
      photosByDay.addPhoto(photo);
    });
    this.resultsAreLoading = false;
  }

  private getPhotosForDay(date: Date, processedDates: any): PhotosForDay {
    let day = PhotosForDay.dateToDayStr(date);
    let pfd = this.photosByDayHash[day];
    console.log("    Looking up Photos For Day " + day + ".  Found existing? " + (pfd != null));
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
