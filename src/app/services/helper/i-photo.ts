import {IImageVersion} from "./i-image-version";

export interface IPhoto {
  id: number;
  title:string;
  description:string;
  time_id:number;
  time:string;
  taken_in_tz:number;
  location_latitude:number;
  location_longitude:number;
  location_name:string;
  source_id:number;
  source_name:string;
  metadata:any;
  tags:Array<number>;
  feature_threshold:number;
  image_versions:{[key:string]:IImageVersion}

}
