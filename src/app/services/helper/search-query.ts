export class SearchQuery {
  searchText:string;
  startDate:Date;
  endDate:Date;
  tagIds:Array<number>;
  featureThreshold: number;
  offsetDate: string;
  timezoneOffsetMin: number;

  constructor(params:any) {
    this.searchText = params["searchText"] === "" ? null : params["searchText"];
    this.startDate = SearchQuery.parseDateFromParams(params["startDate"]);
    this.endDate = SearchQuery.parseDateFromParams(params["endDate"]);
    this.tagIds = SearchQuery.parseArrayOfNumbers(params["tagIds"]);
    this.featureThreshold = SearchQuery.parseNumber(params["featureThreshold"]);
    this.offsetDate = params["offsetDate"] !== "" ? params["offsetDate"] : null;
    this.timezoneOffsetMin = -1 * (new Date().getTimezoneOffset());
  }

  clone() {
    return new SearchQuery(this);
  }

  equals(that) {
    return this.searchText === that.searchText &&
      this.startDate === that.startDate &&
      this.endDate === that.endDate &&
      this.featureThreshold === that.featureThreshold &&
      JSON.stringify(this.tagIds) === JSON.stringify(that.tagIds); //TODO: account for tag order?
  }

  toJsonHash() {
    return {
      search_text: this.searchText,
      start_date: this.startDate,
      end_date: this.endDate,
      tag_ids: this.tagIds,
      feature_threshold: this.featureThreshold,
      offset_date: this.offsetDate,
      target_max_results: 50,
      timezone_offset_min: this.timezoneOffsetMin,
    }
  }

  toQueryParamHash() {
    let queryHash = {};
    if (this.searchText) {
      queryHash["searchText"] = this.searchText;
    }
    if (this.startDate) {
      queryHash["startDate"] = this.startDate;
    }
    if (this.endDate) {
      queryHash["endDate"] = this.endDate;
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

  private buildQueryTerm(field, val, firstTerm) {
    return (firstTerm ? "" : "&") + encodeURIComponent(field) + "=" + encodeURIComponent(val);
  }

  public static parseNumber(d) {
    if (typeof d == "string") {
      return parseInt(d);
    } else {
      return d; //already a number
    }
  }

  public static parseArrayOfNumbers(d: any): Array<number> {
    if(d == null) return null;
    if(typeof d == "string") {
      if(d.startsWith("[")) {
        //looks like json!
        return JSON.parse(d);
      } else {
        //make it look like JSON!
        return JSON.parse("["+d+"]");
      }
    } else {
      //hope it was an array of numbers already
      return d;
    }
  }

  public static parseDateFromParams(d:any):Date {
    if(d == null) return null;
    if(typeof d === 'string') {
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
}
