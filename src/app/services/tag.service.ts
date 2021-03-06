import {Injectable} from "@angular/core";
import {BehaviorSubject, throwError} from "rxjs";
import {ITag} from "./helper/i-tag";
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http";
import {ConfigService} from "./config.service";
import {catchError, retry} from "rxjs/operators";

@Injectable()
export class TagService {
  private tagSubjectsById: { [key: string]: BehaviorSubject<ITag> };

  constructor(private configService: ConfigService,
              private http: HttpClient) {
    this.tagSubjectsById = {};
  }

  searchTags(tagSearch: ITagSearch) {
    return new Promise<Array<BehaviorSubject<ITag>>>((resolve, reject) => {
      let headers = new HttpHeaders({"Content-Type": "application/json"});
      let req = this.http.post<ITagSearchResults>(this.configService.getApiRoot() + "/tag",
        JSON.stringify(tagSearch),
        {headers: headers}).pipe(retry(3), catchError(this.errorHandler));
      req.subscribe((data) => {
        let results = [];
        data.matching_tags.forEach((tag) => {
          let t$ = this.tagSubjectsById[tag.id];
          if (t$) {
            if (JSON.stringify(t$.getValue()) !== JSON.stringify(tag)) {
              //tag changed - update it
              t$.next(tag);
            }
          } else {
            t$ = this.tagSubjectsById[tag.id] = new BehaviorSubject(tag);
          }
          results.push(t$);
        });
        resolve(results);
      }, (err) => {
        reject(err);
      });
    });
  }

  getTag$forIds(ids: Array<number>) {
    let unknownTagIds = [];
    let ret: { [key: string]: BehaviorSubject<ITag> } = {};
    console.log("Photo has tag ids=" + ids);
    ids.forEach((id) => {
      let t$ = this.tagSubjectsById[id];
      if (!t$) {
        let tag = <ITag><any>{
          id: id,
          tag_type: true
        };
        let t$ = ret[id] = this.tagSubjectsById[id] = new BehaviorSubject(tag);
        unknownTagIds.push(id);
        ret[id] = t$;
      } else {
        ret[id] = t$;
      }
    });

    if (unknownTagIds.length > 0) {
      this.retrieveTagsForIds(unknownTagIds);
    }
    return ret;
  }

  private retrieveTagsForIds(tagIds) {
    let headers = new HttpHeaders({"Content-Type": "application/json"});
    let req = this.http.post<ITagResults>(this.configService.getApiRoot() + "/tag/ids",
      JSON.stringify(tagIds),
      {headers: headers}).pipe(retry(3), catchError(this.errorHandler));
    req.subscribe((data) => {
      Object.keys(data.tags).forEach((idStr) => {
        let id = parseInt(idStr);
        let tag = data.tags[id];
        let t$ = this.tagSubjectsById[id];
        console.log("Retrieved " + JSON.stringify(tag) + " for id=" + id + "; tagSubj=", t$)
        t$.next(tag);
      });
    });
  }

  private errorHandler(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // Return an observable with a user-facing error message.
    return throwError(
      'Something bad happened; please try again later.');
  }

}

export class ITagSearch {
  searchText: string;
}

class ITagResults {
  tags: { [key: string]: ITag }
}

class ITagSearchResults {
  matching_tags: Array<ITag>
}
