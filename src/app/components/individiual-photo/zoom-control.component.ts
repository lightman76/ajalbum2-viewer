import {Component, EventEmitter, Input, Output} from '@angular/core';
import {faSearchPlus, faTimes} from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'photo-zoom-control',
  template: `
    <div class="zoom-toggle" (click)="zoomControlToggle($event)" [matTooltip]="'Toggle zoom controls'" tabindex="0">
      <fa-icon [icon]="faSearchPlus" *ngIf="!(showingZoomControls)"></fa-icon>
      <fa-icon [icon]="faTimes" *ngIf="showingZoomControls"></fa-icon>
      <span class="magnification-display">{{zoomLevel|number:"1.0-2"}}x</span>
    </div>
    <div class="zoom-toggle-dropdown" *ngIf="showingZoomControls">
      <mat-slider min="1" max="20" step="0.05" vertical [value]="zoomLevel" (change)="onZoomSliderChange($event)"
                  (input)="onZoomSliderChange($event)"></mat-slider>
      <div class="magnification-reset" (click)="resetZoomLevel($event)" tabindex="0">
        Reset
      </div>
    </div>
  `,
  styles: [`
    .zoom-toggle-dropdown {
      box-sizing: border-box;
      width: 55px;
      padding: 5px 5px 15px 5px;
      background-color: #aaaaaa88;
    }

    .magnification-display {
      font-size: 50%;
    }

    .magnification-reset {
      font-size: 80%;
      background-color: #777;
      color: white;
      border-radius: 4px;
    }

    .magnification-reset:hover {
      background-color: #333;
    }
  `],
})
export class PhotoZoomControl {
  faSearchPlus = faSearchPlus;
  faTimes = faTimes;

  showingZoomControls: boolean = false;

  @Input() zoomLevel: number;
  @Output() updatedZoomLevel: EventEmitter<number>;

  constructor() {
    this.updatedZoomLevel = new EventEmitter<number>();
  }

  zoomControlToggle(evt) {
    this.showingZoomControls = !this.showingZoomControls;
  }

  onZoomSliderChange(zoomLevel) {
    this.updatedZoomLevel.emit(zoomLevel.value);
  }

  resetZoomLevel(evt) {
    this.zoomLevel = 1.0;
    this.updatedZoomLevel.emit(1.0);
    this.showingZoomControls = false;
  }

}
