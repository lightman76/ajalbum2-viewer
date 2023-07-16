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
      <mat-slider step="0.05" showTickMarks min="0" max="5">
        <input matSliderThumb
               [value]="calculatedZoomLevel"
               (valueChange)="onZoomSliderChange($event)"
        >
      </mat-slider>
      <div class="magnification-reset" (click)="resetZoomLevel($event)" tabindex="0">
        Reset
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: relative;
    }

    .zoom-toggle-dropdown {
      position: absolute;
      right: 0;
      z-index: 20;
      top: 20px;
      box-sizing: border-box;
      height: 55px;
      width: 400px;
      padding: 5px 5px 15px 5px;
      background-color: #aaaaaa88;

    }

    .zoom-toggle-dropdown mat-slider {
      width: 300px;
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
  calculatedZoomLevel: number;

  constructor() {
    this.updatedZoomLevel = new EventEmitter<number>();
  }

  ngOnChanges(changes) {
    if (changes && changes['zoomLevel']) {
      this.calculatedZoomLevel = this.calculatedZoomFromUiZoom(this.zoomLevel);
    }
  }

  calculatedZoomFromUiZoom(z) {
    let calcZoom = z - 1.0;

    if (z < 1.0) {
      calcZoom = -1.0 / (z) + 1.0;
    }
    console.log('  >>> Incoming zoom change in val=' + z + ' -->outval=' + calcZoom);
    return calcZoom;
  }

  zoomControlToggle(evt) {
    this.showingZoomControls = !this.showingZoomControls;
  }

  onZoomSliderChange(calcZoomLevel) {
    if (calcZoomLevel < 0) {
      this.calculatedZoomLevel = 0;
      this.zoomLevel = 1;
      console.log('Updated zoom level1 ' + this.zoomLevel + '/' + this.calculatedZoomLevel);
      this.updatedZoomLevel.emit(this.zoomLevel);
    } else {
      this.calculatedZoomLevel = calcZoomLevel;
      this.zoomLevel = calcZoomLevel + 1;
      console.log('Updated zoom level2 ' + this.zoomLevel + '/' + this.calculatedZoomLevel);
      this.updatedZoomLevel.emit(this.zoomLevel);
    }

  }

  resetZoomLevel(evt) {
    this.zoomLevel = 1.0;
    this.updatedZoomLevel.emit(1.0);
    this.showingZoomControls = false;
  }

}
