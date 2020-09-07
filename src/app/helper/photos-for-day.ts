import {Photo} from "./photo";
import {BehaviorSubject} from "rxjs";
import {PhotoResultSetService} from "../services/photo-result-set.service";

export class PhotosForDay {
  private photos: Array<Photo>;
  forDate: Date
  photoResultsLoaded: boolean = false;
  private photoList$: BehaviorSubject<Array<Photo>>;
  displayHeight$: BehaviorSubject<number>;
  offsetFromTop: number = 0; //This will be managed outside of the class - just need the data element here to track this value
  dateInViewRange: boolean = false;
  private photoCount$: BehaviorSubject<number>;

  constructor(forDate: Date, private photoResultSetService: PhotoResultSetService) {
    this.forDate = new Date(forDate.getFullYear(), forDate.getMonth(), forDate.getDate(), 0, 0, 0, 0);
    this.photos = [];
    this.photoList$ = new BehaviorSubject<Array<Photo>>(this.photos);
    this.photoCount$ = new BehaviorSubject<number>(0);
    this.displayHeight$ = new BehaviorSubject<number>(40);
    this.photoCount$.subscribe((numPhotos) => {
      this.recomputeHeight();
    });
    this.photoResultSetService.getThumbnailDims$().subscribe(() => {
      this.recomputeHeight();
    });
    this.photoResultSetService.getViewerWidth$().subscribe(() => {
      this.recomputeHeight();
    });
  }

  public static dateToDayStr(d: Date) {
    if (d == null) return null;
    //TODO: do I need to check the tz and convert to local TZ if not already?
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  getPhotoList$() {
    return this.photoList$;
  }

  recomputeHeight() {
    let thumbDims = this.photoResultSetService.getThumbnailDims$().getValue();

    this.displayHeight$.next(
      Math.ceil(
        1.0 * this.photoCount$.getValue() /
        Math.floor(1.0 * this.photoResultSetService.getViewerWidth$().getValue() / thumbDims.width)) * thumbDims.height + 40);
  }

  clearList() {
    this.photos = [];
    this.photoList$.next(this.photos);
  }

  addPhoto(photo: Photo) {
    //console.log("Adding photo for date="+this.forDate, photo);
    let oldPhotos = this.photos;
    this.photos = oldPhotos.slice();
    this.photos.push(photo);
    this.photos.sort((a, b) => {
      return b.time.getTime() - a.time.getTime();
    });
    this.photoList$.next(this.photos);
    if (this.photos.length > this.photoCount$.getValue()) {
      //Uhoh, this shouldn't happen (unless photos are loaded between our call to get date outline and querying for the day)
      this.photoCount$.next(this.photos.length);
    }
    this.photoResultsLoaded = true; //if we have one, we'll say it's loaded...
  }

  //NOTE: this is NOT (necessarily) a count of the number of photos in the PhotoList
  getPhotoCount$() {
    return this.photoCount$;
  }

  getDisplayHeight$() {
    return this.displayHeight$;
  }
}
