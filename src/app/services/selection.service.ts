import {Injectable} from '@angular/core';
import {PhotoService} from './photo.service';
import {BehaviorSubject} from 'rxjs';

@Injectable()
export class SelectionService {
  private selectedPhotosById$: BehaviorSubject<any>;
  private selectionEnabled$: BehaviorSubject<boolean>;

  constructor(
    private photoService: PhotoService,
  ) {
    this.selectedPhotosById$ = new BehaviorSubject<any>({});
    this.selectionEnabled$ = new BehaviorSubject<boolean>(false);
  }

  getSelectionEnabled$() {
    return this.selectionEnabled$;
  }

  getSelectedPhotosById$() {
    return this.selectedPhotosById$;
  }

  clearSelections() {
    this.selectedPhotosById$.next({});
  }

}
