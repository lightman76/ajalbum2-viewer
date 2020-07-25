import {PhotoService} from "./photo.service";
import {PhotosForDay} from "../helper/photos-for-day";
import {SearchQuery} from "./helper/search-query";
import {ISearchResultsPage} from "./helper/i-search-results-page";
import {Injectable} from "@angular/core";
import {Photo} from "../helper/photo";
import {BehaviorSubject} from "rxjs";

@Injectable()
export class PhotoResultSetService {
  private photosByDayList:Array<PhotosForDay>;
  private photosByDayHash:{[key:string]:PhotosForDay};
  private search:SearchQuery;

  private fetchedPages:Array<number>
  private resultsPerPage = 250;

  private photosByDay$:BehaviorSubject<Array<PhotosForDay>>;

  constructor(
    private photoService:PhotoService,
  ) {
    this.photosByDayList = [];
    this.photosByDayHash = {};
    this.fetchedPages = [];
    this.photosByDay$ = new BehaviorSubject<Array<PhotosForDay>>(this.photosByDayList);
  }

  //when search updated, clear prior results
  updateSearch(
    inSearch:SearchQuery,
    resultsPerPage:number = 250
  ) {
    this.photosByDayList = [];
    this.photosByDayHash = {};
    this.fetchedPages = [];
    this.resultsPerPage = resultsPerPage;
    this.search = inSearch.clone();
    this.initiateSearch();
  }

  getPhotosByDay$() {
    return this.photosByDay$;
  }

  private initiateSearch() {
    this.fetchPage(0);
  }

  private fetchPage(pageNum:number) {
    this.photoService.getSearchResultsPage(this.search, pageNum, this.resultsPerPage).subscribe((results)=>{
      this.parseResults(results);
    });
  }

  private parseResults(results:ISearchResultsPage) {
    if(this.fetchedPages.indexOf(results.page) < 0) {
      this.fetchedPages.push(results.page);
      results.photos.forEach((ip)=>{
        let photo = Photo.fromIPhoto(ip);
        let photosByDay = this.getPhotosForDay(photo.time);
        photosByDay.addPhoto(photo);
      });
    } else {
      //we already processed results for this page!!!!
      console.error("!!! Already got results for page "+results.page)
    }
  }

  private getPhotosForDay(date:Date):PhotosForDay {
    let day = PhotosForDay.dateToDayStr(date);
    let pfd = this.photosByDayHash[day];
    if(pfd == null) {
      pfd = new PhotosForDay(date);
      let oldList = this.photosByDayList;
      this.photosByDayList = oldList.slice();
      this.photosByDayList.push(pfd);
      this.photosByDayHash[day] = pfd;
      this.photosByDayList.sort((a,b)=>{
        return b.forDate.getTime() - a.forDate.getTime();
      });
      this.photosByDay$.next(this.photosByDayList);
    }
    return pfd;
  }
  private addPhotosForDay(pfd:PhotosForDay) {
  }
}
