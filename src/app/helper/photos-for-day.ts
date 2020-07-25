import {Photo} from "./photo";
import {BehaviorSubject} from "rxjs";

export class PhotosForDay {
  private photos:Array<Photo>;
  forDate:Date
  private photoList$:BehaviorSubject<Array<Photo>>;

  constructor(forDate:Date) {
    this.forDate = new Date(forDate.getFullYear(), forDate.getMonth(), forDate.getDate(), 0, 0,0,0);
    this.photos = [];
    this.photoList$ = new BehaviorSubject<Array<Photo>>(this.photos);
  }

  getPhotoList$() {
    return this.photoList$;
  }

  addPhoto(photo:Photo) {
    console.log("Adding photo for date="+this.forDate, photo);
    let oldPhotos = this.photos;
    this.photos = oldPhotos.slice();
    this.photos.push(photo);
    this.photos.sort((a,b)=>{
      return b.time.getTime() - a.time.getTime();
    });
    this.photoList$.next(this.photos);
  }

  public static dateToDayStr(d:Date) {
    //TODO: do I need to check the tz and convert to local TZ if not already?
    return d.getFullYear()+"-"+d.getMonth()+"-"+d.getDate();
  }
}
