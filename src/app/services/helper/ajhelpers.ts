import {HttpErrorResponse} from '@angular/common/http';
import {throwError} from 'rxjs';
import {ITag} from './i-tag';
import {faBook, faCalendar, faMapMarkerAlt, faTag, faUser} from '@fortawesome/pro-solid-svg-icons';

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

  static getIconForType(tag: ITag) {
    if (tag.tag_type === 'tag') {
      return faTag;
    } else if (tag.tag_type === 'location') {
      return faMapMarkerAlt;
    } else if (tag.tag_type === 'album') {
      return faBook;
    } else if (tag.tag_type === 'people') {
      return faUser;
    } else if (tag.tag_type === 'event') {
      return faCalendar;
    }
    return faTag;
  }


}
