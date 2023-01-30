import {HttpErrorResponse} from '@angular/common/http';
import {throwError} from 'rxjs';
import {ITag} from './i-tag';
import {faBook, faCalendar, faDove, faMapMarkerAlt, faTag, faUser} from '@fortawesome/pro-solid-svg-icons';

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
    if (!tag) {
      return null;
    }
    return this.getIconForTagType(tag.tag_type);
  }

  static getIconForTagType(tagType: string) {
    if (tagType === 'tag') {
      return faTag;
    } else if (tagType === 'location') {
      return faMapMarkerAlt;
    } else if (tagType === 'album') {
      return faBook;
    } else if (tagType === 'people') {
      return faUser;
    } else if (tagType === 'event') {
      return faCalendar;
    } else if (tagType === 'species') {
      return faDove;
    }
    return faTag;
  }


}
