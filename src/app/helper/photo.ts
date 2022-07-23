import {IImageVersion} from '../services/helper/i-image-version';
import {IPhoto} from '../services/helper/i-photo';
import {JsonUtils} from './json-utils';

export class Photo {
  id: number;
  title: string;
  description: string;
  time_id: number;
  time: Date;
  taken_in_tz: number;
  location_latitude: number;
  location_longitude: number;
  location_name:string;
  source_id:number;
  source_name:string;
  metadata:any;
  tags:Array<number>;
  feature_threshold:number;
  image_versions: { [key: string]: IImageVersion };
  lastRefreshed: Date;

  constructor() {}

  public static fromIPhoto(i:IPhoto):Photo {
    let photo = new Photo();
    photo.id = i.id;
    photo.title = i.title;
    photo.description = i.description;
    photo.time_id = i.time_id;
    photo.time = JsonUtils.parseJsonDate(i.time);
    photo.taken_in_tz = i.taken_in_tz;
    photo.location_latitude = i.location_latitude;
    photo.location_longitude = i.location_longitude;
    photo.location_name = i.location_name;
    photo.source_id = i.source_id;
    photo.source_name = i.source_name;
    photo.metadata = i.metadata;
    photo.tags = i.tags || [];
    photo.feature_threshold = i.feature_threshold;
    photo.image_versions = i.image_versions;
    photo.lastRefreshed = new Date();
    return photo;
  }
}
