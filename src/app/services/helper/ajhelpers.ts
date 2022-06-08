import {HttpErrorResponse} from '@angular/common/http';
import {throwError} from 'rxjs';

export class AJHelpers {
  static formatDashedDate(date) {
    if (!date) {
      return null;
    }
    if (typeof date === 'string') {
      return date;
    }
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
  }

  static parseDashedDate(dateStr) {
    return new Date(dateStr);
  }

  static equalDates(a, b) {
    if (a === b) {
      return true;
    }
    if (!a && b || !b && a) {
      return false;
    }
    return a.getTime() === b.getTime();
  }

  static errorHandler(error: HttpErrorResponse) {
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
