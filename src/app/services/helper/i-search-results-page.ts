import {IPhoto} from "./i-photo";

export interface ISearchResultsPage {
  page:number;
  results_per_page:number;
  photos: Array<IPhoto>;
}
