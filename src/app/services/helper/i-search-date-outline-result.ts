export interface ISearchDateOutlineResult {
  offset_date: number,
  next_offset_date: number,
  result_count_by_date: Array<ISearchDateOutline>
}

export interface ISearchDateOutline {
  date: string,
  num_items: number;
}
