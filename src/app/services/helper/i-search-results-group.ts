import {IPhoto} from "./i-photo";

export interface ISearchResultsGroup {
  offset_date: Date;
  next_offset_date: Date;
  photos: Array<IPhoto>;
}
