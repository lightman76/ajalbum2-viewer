import {Injectable} from "@angular/core";
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http";
import {throwError} from 'rxjs';
import {catchError, retry} from 'rxjs/operators';
import {ConfigService} from "./config.service";
import {ISearchResultsPage} from "./helper/i-search-results-page";
import {SearchQuery} from "./helper/search-query";


@Injectable()
export class PhotoService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService,
  ){}

  getSearchResultsPage(searchQuery:SearchQuery, pageNum:number=0, limit:number=250) {
    let headers = new HttpHeaders();
    headers.append("Content-Type","application/json");

    return this.http.post<ISearchResultsPage>(this.configService.getApiRoot() + "/photo/search", JSON.stringify(searchQuery.toJsonHash()), {
      headers: headers,
      responseType: 'json'
    }).pipe(retry(3), catchError(this.errorHandler));
  }

  private errorHandler(error:HttpErrorResponse) {
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


