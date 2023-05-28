import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {throwError} from 'rxjs';
import {catchError, retry} from 'rxjs/operators';
import {ConfigService} from './config.service';
import {ISearchResultsGroup} from './helper/i-search-results-group';
import {SearchQuery} from './helper/search-query';
import {ISearchDateOutlineResult} from './helper/i-search-date-outline-result';
import {PhotosForDay} from '../helper/photos-for-day';
import {IUpdatePhotoResults} from './helper/i-update-photo-results';
import {IDeletePhotoResults} from './helper/i-delete-photo-results';


@Injectable()
export class PhotoService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService,
  ) {
  }

  getSearchResults(searchQuery: SearchQuery, dateOffset: number) {
    let headers = new HttpHeaders({'Content-Type': 'application/json'});
    let query = searchQuery.clone();
    if (!dateOffset) {
      let d = new Date();
      dateOffset = parseInt(PhotosForDay.dateToDayStr(d));
    }
    query.offsetDate = dateOffset; //PhotosForDay.dateToDayStr(dateOffset);
    return this.http.post<ISearchResultsGroup>(this.configService.getApiRoot() + '/photo/search', JSON.stringify(query.toJsonHash()), {
      headers: headers,
      responseType: 'json'
    }).pipe(retry(1), catchError(this.errorHandler));
  }

  getSearchDateOutline(searchQuery: SearchQuery, dateOffset: number) {
    let headers = new HttpHeaders({'Content-Type': 'application/json'});
    let query = searchQuery.clone();
    if (!dateOffset) {
      let d = new Date();
      dateOffset = parseInt(PhotosForDay.dateToDayStr(d));
    }
    query.offsetDate = dateOffset;//PhotosForDay.dateToDayStr(dateOffset);
    return this.http.post<ISearchDateOutlineResult>(this.configService.getApiRoot() + '/photo/date_outline_search', JSON.stringify(query.toJsonHash()), {
      headers: headers,
      responseType: 'json'
    }).pipe(retry(1), catchError(this.errorHandler));
  }

  updatePhotos(authorization: string, user: string, updateFields: PhotoUpdateFields) {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + encodeURIComponent(authorization)
    });

    return this.http.put<IUpdatePhotoResults>(this.configService.getApiRoot() + '/' + encodeURIComponent(user) + '/photo', JSON.stringify(updateFields), {
      headers: headers,
      responseType: 'json'
    }).pipe(retry(1), catchError(this.errorHandler));
  }

  deletePhotos(authorization: string, user: string, photoIds: Array<number>) {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + encodeURIComponent(authorization)
    });

    return this.http.delete<IDeletePhotoResults>(this.configService.getApiRoot() + '/' + encodeURIComponent(user) + '/photo/' + photoIds.join(','), {
      headers: headers,
      responseType: 'json'
    }).pipe(retry(1), catchError(this.errorHandler));

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

export class PhotoUpdateFields {
  photo_time_ids: Array<number>;
  updated_title: string;
  updated_description: string;
  updated_feature_threshold: number;
  add_tags: Array<number>;
  remove_tags: Array<number>;
}


