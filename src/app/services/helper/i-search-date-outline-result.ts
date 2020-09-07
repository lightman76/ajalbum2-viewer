export interface ISearchDateOutlineResult {
  offset_date: Date,
  next_offset_date: Date,
  result_count_by_date: Array<ISearchDateOutline>
}

export interface ISearchDateOutline {
  date: Date,
  num_items: number;
}
