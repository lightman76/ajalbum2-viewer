export class SearchQuery {
  searchText:string;
  startDate:Date;
  endDate:Date;
  tagIds:Array<number>;
  featureThreshold:number;

  constructor(params:any) {
    this.searchText = params["searchText"];
    this.startDate = SearchQuery.parseDateFromParams(params["startDate"]);
    this.endDate = SearchQuery.parseDateFromParams(params["endDate"]);
    this.tagIds = SearchQuery.parseArrayOfNumbers(params["tagIds"]);
    this.featureThreshold = SearchQuery.parseNumber(params["featureThreshold"]);
  }

  clone() {
    return new SearchQuery(this);
  }

  public static parseNumber(d) {
    if(typeof d == "string") {
      return parseInt(d);
    } else {
      return d; //already a number
    }
  }

  public static parseArrayOfNumbers(d:any):Array<number> {
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
