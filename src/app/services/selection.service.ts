import {Injectable} from '@angular/core';
import {PhotoService} from './photo.service';
import {BehaviorSubject} from 'rxjs';
import {Photo} from '../helper/photo';

@Injectable()
export class SelectionService {
  private selectedPhotosById$: BehaviorSubject<{ [id: string]: Photo }>;
  private lastSelectedPhotoId$: BehaviorSubject<number>;
  private selectionEnabled$: BehaviorSubject<boolean>;

  constructor(
    private photoService: PhotoService,
  ) {
    this.selectedPhotosById$ = new BehaviorSubject<any>({});
    this.lastSelectedPhotoId$ = new BehaviorSubject<number>(null);
    this.selectionEnabled$ = new BehaviorSubject<boolean>(false);
  }

  getSelectionEnabled$() {
    return this.selectionEnabled$;
  }

  getSelectedPhotosById$() {
    return this.selectedPhotosById$;
  }

  getLastSelectedPhotoId$() {
    return this.lastSelectedPhotoId$;
  }

  clearSelections() {
    this.selectedPhotosById$.next({});
  }

}
