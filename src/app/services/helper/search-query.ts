import {AJHelpers} from './ajhelpers';

export class SearchQuery {
  userName: string = null;
  searchText: string = null;
  startDate: Date = null;
  endDate: Date = null;
  tagIds: Array<number> = null;
  featureThreshold: number = null;
  offsetDate: number = null;
  timezoneOffsetMin: number = null;

  constructor(params: any) {
    this.userName = params['userName'];
    this.searchText = (params['searchText'] === '' ? null : params['searchText']) || null;
    this.startDate = SearchQuery.parseDateFromParams(params['startDate']);
    this.endDate = SearchQuery.parseDateFromParams(params['endDate']);
    this.tagIds = SearchQuery.parseArrayOfNumbers(params['tagIds']);
    this.featureThreshold = SearchQuery.parseNumber(params['featureThreshold']);
    this.offsetDate = (params['offsetDate'] !== '' ? params['offsetDate'] : null) || null;
    this.timezoneOffsetMin = -1 * (new Date().getTimezoneOffset());
    //console.log("Parsed tagIds as ",this.tagIds)
  }

  clone() {
    return new SearchQuery(this);
  }

  public static parseNumber(d) {
    if (d === undefined || d === null) {
      return null;
    }
    if (typeof d == 'string') {
      return parseInt(d);
    } else {
      return d; //already a number
    }
  }

  toJsonHash() {
    return {
      user: this.userName,
      search_text: this.searchText,
      start_date: this.startDate,
      end_date: this.endDate,
      tags: this.tagIds,
      feature_threshold: this.featureThreshold,
      offset_date: this.offsetDate,
      target_max_results: 50,
      timezone_offset_min: this.timezoneOffsetMin,
    };
  }

  public static parseArrayOfNumbers(d: any): Array<number> {
    if (!d) {
      return null;
    }
    if (typeof d == 'string') {
      if (d.startsWith('[')) {
        //looks like json!
        return JSON.parse(d);
      } else {
        //make it look like JSON!
        return JSON.parse('[' + d + ']');
      }
    } else {
      //hope it was an array of numbers already
      return d;
    }
  }

  public static parseDateFromParams(d: any): Date {
    if (!d) {
      return null;
    }
    if (typeof d === 'string') {
      try {
        //TODO: this will be parsed in the local time zone, which is good I think...
        return new Date(Date.parse(d));
      } catch (e) {
        return null;
      }
    } else {
      return d; //hope this is already a date
    }
  }

  private buildQueryTerm(field, val, firstTerm) {
    return (firstTerm ? '' : '&') + encodeURIComponent(field) + '=' + encodeURIComponent(val);
  }

  equals(that) {
    if (!that) {
      return false;
    }
    return this.searchText === that.searchText &&
      this.userName === that.userName &&
      AJHelpers.equalDates(this.startDate, that.startDate) &&
      AJHelpers.equalDates(this.endDate, that.endDate) &&
      this.featureThreshold === that.featureThreshold &&
      JSON.stringify(this.tagIds) === JSON.stringify(that.tagIds); //TODO: account for tag order?
  }

  toQueryParamHash() {
    let queryHash = {};
    if (this.userName) {
      queryHash['userName'] = this.userName;
    }
    if (this.searchText) {
      queryHash['searchText'] = this.searchText;
    }
    if (this.startDate) {
      queryHash['startDate'] = AJHelpers.formatDashedDate(this.startDate);
    }
    if (this.endDate) {
      queryHash['endDate'] = AJHelpers.formatDashedDate(this.endDate);
    }
    if (this.tagIds) {
      queryHash["tagIds"] = this.tagIds;
    }
    if (this.featureThreshold) {
      queryHash["featureThreshold"] = this.featureThreshold;
    }

    return queryHash;
  }

  toQueryString() {
    let queryString = "";
    let firstTerm = true;
    /*
        if (this.userName) {
          queryString += this.buildQueryTerm("userName", this.userName, firstTerm);
          firstTerm = false;
        }
    */
    if (this.searchText) {
      queryString += this.buildQueryTerm("searchText", this.searchText, firstTerm);
      firstTerm = false;
    }
    if (this.startDate) {
      queryString += this.buildQueryTerm("startDate", this.startDate, firstTerm);
      firstTerm = false;
    }
    if (this.endDate) {
      queryString += this.buildQueryTerm("endDate", this.endDate, firstTerm);
      firstTerm = false;
    }
    if (this.tagIds) {
      queryString += this.buildQueryTerm("tagIds", this.tagIds, firstTerm);
      firstTerm = false;
    }
    if (this.featureThreshold) {
      queryString += this.buildQueryTerm("featureThreshold", this.featureThreshold, firstTerm);
      firstTerm = false;
    }

    return queryString === "" ? null : queryString;
  }
}
