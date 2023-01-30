import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {ITag} from './helper/i-tag';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ConfigService} from './config.service';
import {catchError, retry} from 'rxjs/operators';
import {AJHelpers} from './helper/ajhelpers';

@Injectable()
export class TagService {
  private tagSubjectsById: { [key: string]: BehaviorSubject<ITag> };
  private allTagsPromise = null;

  constructor(private configService: ConfigService,
              private http: HttpClient) {
    this.tagSubjectsById = {};
  }

  searchTags(tagSearch: ITagSearch) {
    return new Promise<Array<BehaviorSubject<ITag>>>((resolve, reject) => {
      let headers = new HttpHeaders({'Content-Type': 'application/json'});
      let req = this.http.post<ITagSearchResults>(this.configService.getApiRoot() + '/tag',
        JSON.stringify(tagSearch),
        {headers: headers}).pipe(retry(3), catchError(AJHelpers.errorHandler));
      req.subscribe((data) => {
        let results = [];
        data.matching_tags.forEach((tag) => {
          let t$ = this.tagSubjectsById[tag.id];
          if (t$) {
            if (JSON.stringify(t$.getValue()) !== JSON.stringify(tag)) {
              //tag changed - update it
              t$.next(tag);
            }
          } else {
            t$ = this.tagSubjectsById[tag.id] = new BehaviorSubject(tag);
          }
          results.push(t$);
        });
        resolve(results);
      }, (err) => {
        reject(err);
      });
    });
  }

  getAllTags(userName: string): Promise<Array<BehaviorSubject<ITag>>> {
    if (this.allTagsPromise) {
      return this.allTagsPromise;
    }
    this.allTagsPromise = new Promise<Array<BehaviorSubject<ITag>>>((resolve, reject) => {
      if (!userName) {
        reject('Missing user name');
        this.allTagsPromise = null;
        return;
      }
      let headers = new HttpHeaders({'Content-Type': 'application/json'});
      let req = this.http.get<IAllTagResults>(this.configService.getApiRoot() + '/' + encodeURIComponent(userName) + '/tags',
        {headers: headers}).pipe(retry(3), catchError(AJHelpers.errorHandler));
      req.subscribe((data) => {
        let results = [];
        data.all_tags.forEach((tag) => {
          let t$ = this.tagSubjectsById[tag.id];
          if (t$) {
            if (JSON.stringify(t$.getValue()) !== JSON.stringify(tag)) {
              //tag changed - update it
              t$.next(tag);
            }
          } else {
            t$ = this.tagSubjectsById[tag.id] = new BehaviorSubject(tag);
          }
          results.push(t$);
        });
        this.allTagsPromise = null;
        resolve(results);
      }, (err) => {
        reject(err);
      });
    });

    return this.allTagsPromise;
  }

  getTag$forIds(ids: Array<number>) {
    let unknownTagIds = [];
    let ret: { [key: string]: BehaviorSubject<ITag> } = {};
    console.log('Photo has tag ids=' + ids);
    ids.forEach((id) => {
      let t$ = this.tagSubjectsById[id];
      if (!t$) {
        let tag = <ITag> <any> {
          id: id,
          tag_type: true
        };
        let t$ = ret[id] = this.tagSubjectsById[id] = new BehaviorSubject(tag);
        unknownTagIds.push(id);
        ret[id] = t$;
      } else {
        ret[id] = t$;
      }
    });

    if (unknownTagIds.length > 0) {
      this.retrieveTagsForIds(unknownTagIds);
    }
    return ret;
  }

  async createTag(userName, authorization, tagType, name, description, shortcutUrl, optionsHash) {
    return new Promise<BehaviorSubject<ITag>>((resolve, reject) => {
      let headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + encodeURIComponent(authorization)
      });
      let req = this.http.post<ICreateTagResult>(this.configService.getApiUserRoot(userName) + '/tag',
        JSON.stringify({
          tag_type: tagType,
          name: name,
          description: description,
          shortcut_url: shortcutUrl,
          location_latitude: optionsHash.location_latitude,
          location_longitude: optionsHash.location_longitude,
          event_date: optionsHash.event_date,
        }),
        {headers: headers}).pipe(retry(1), catchError(AJHelpers.errorHandler));
      req.subscribe((data) => {
        let tag = data.tag;
        let id = tag.id;
        let t$ = this.tagSubjectsById[id];
        if (!t$) {
          t$ = this.tagSubjectsById[id] = new BehaviorSubject<ITag>(tag);
        } else {
          t$.next(tag);
        }
        resolve(t$);
      }, reject);
    });
  }

  private retrieveTagsForIds(tagIds) {
    let headers = new HttpHeaders({'Content-Type': 'application/json'});
    let req = this.http.post<ITagResults>(this.configService.getApiRoot() + '/tag/ids',
      JSON.stringify(tagIds),
      {headers: headers}).pipe(retry(1), catchError(AJHelpers.errorHandler));
    req.subscribe((data) => {
      Object.keys(data.tags).forEach((idStr) => {
        let id = parseInt(idStr);
        let tag = data.tags[id];
        let t$ = this.tagSubjectsById[id];
        //console.log("Retrieved " + JSON.stringify(tag) + " for id=" + id + "; tagSubj=", t$)
        t$.next(tag);
      });
    });
  }
}

export class ITagSearch {
  searchText: string;
}

class ITagResults {
  tags: { [key: string]: ITag };
}

class ICreateTagResult {
  tag: ITag;
}

class ITagSearchResults {
  matching_tags: Array<ITag>;
}

class IAllTagResults {
  all_tags: Array<ITag>;
}
