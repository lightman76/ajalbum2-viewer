import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Photo} from '../../helper/photo';
import {ActivatedRoute, Router} from '@angular/router';
import {PhotoService} from '../../services/photo.service';
import {PhotoResultSetService} from '../../services/photo-result-set.service';
import {faChevronCircleDown, faChevronCircleUp} from '@fortawesome/pro-solid-svg-icons';
import {BehaviorSubject} from 'rxjs';
import {ITag} from '../../services/helper/i-tag';
import {TagService} from '../../services/tag.service';

@Component({
  selector: 'individual-photo-info',
  template: `
    <div class="info__nub">
      <span class="show-less-btn" *ngIf="displayStatus === 'single-line' || displayStatus === 'full1'"
            [matTooltip]="'Show less.'" [matTooltipShowDelay]="750"
            (click)="showLess($event)">
        <fa-icon [icon]="faChevronCircleDown" [size]="'2x'"></fa-icon>
      </span>
      <span class="show-more-btn" *ngIf="displayStatus === 'single-line' || displayStatus === 'minimized'"
            [matTooltip]="'Show more.'" [matTooltipShowDelay]="750"
            (click)="showMore($event)">
        <fa-icon [icon]="faChevronCircleUp" [size]="'2x'"></fa-icon>
      </span>
    </div>
    <div class="info__single-line" *ngIf="photo">
      <span class="photo-date-time">
        {{photo.time | date:'short'}}
      </span>
      <span class="title">
        {{photo.title}}
      </span>
    </div>
    <div class="info__full1">
      <div class="full__line1">
        <span class="photo-date-time" *ngIf="photo">
          {{photo.time | date:'short'}}
        </span>
        <span class="title">
          {{photo.title}}
        </span>
      </div>
      <div class="full__line2">
        <span class="title">
          {{photo.description}}
        </span>
      </div>
      <div class="full__line3">
        <span *ngFor="let tagSub of tagSubjs">
          <tag [tagSubject]="tagSub" *ngIf="tagSub"></tag>
        </span>
        <!--TODO: tags, etc. -->
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: auto;
      overflow: visible;
      z-index: 10;
    }

    .info__nub {
      display: none;
      position: absolute;
      right: 10px;
      top: -25px;
      width: 60px;
      height: 35px;
      text-align: right;
      color: rgba(55, 55, 55, 0.6);
    }

    .info__nub:hover {
      color: rgba(55, 55, 55, 1);
    }

    .show-more-btn, .show-less-btn {
      display: inline-block;
    }

    .show-less-btn {
      margin-right: 3px;
    }

    .info__single-line {
      display: block;
      overflow: hidden;
      height: 0;
      background-color: rgba(200, 200, 200, 0.6);
      transition-property: height;
      transition-duration: 250ms;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      padding-left: 15px;
      padding-right: 15px;
      padding-top: 3px;
    }
    .info__single-line:focus-within {
      background-color: rgba(200,200,200,1.0);
    }

    @media(hover) {
      .info__single-line:hover {
        background-color: rgba(200,200,200,1.0);
      }
    }

    .info__full1 {
      display: block;
      overflow: hidden;
      height: 0;
      background-color: rgba(200, 200, 200, 0.6);
      transition-property: height;
      transition-duration: 250ms;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      padding-left: 15px;
      padding-right: 15px;
      padding-top: 3px;
    }

    .info__full1:focus-within {
      background-color: rgba(200,200,200,1.0);
    }

    @media(hover) {
      .info__full1:hover {
        background-color: rgba(200,200,200,1.0);
      }
    }


    :host.show__nub {
    }

    :host.show__nub .info__nub, :host.show__single_line .info__nub, :host.show__full1 .info__nub {
      display: block;
    }

    :host.show__single_line .info__single-line {
      height: 25px;
    }

    :host.show__full1 .info__full1 {
      height: auto;
    }
  `],
  host: {
    '[class.show__nub]': 'displayStatus === \'minimized\'',
    '[class.show__single_line]': 'displayStatus === \'single-line\'',
    '[class.show__full1]': 'displayStatus === \'full1\'',
    '(document:keydown.arrowup)': 'keyShowMore($event)',
    '(document:keydown.arrowdown)': 'keyShowLess($event)',
  }
})

export class IndividualPhotoInfoComponent implements OnChanges {
  faChevronCircleUp = faChevronCircleUp;
  faChevronCircleDown = faChevronCircleDown;

  @Input() photo: Photo;
  @Input() zoomLevel: number;
  tagSubjs: Array<BehaviorSubject<ITag>>;

  displayStatus: string = 'single-line';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private photoService: PhotoService,
    private resultSetService: PhotoResultSetService,
    private tagService: TagService,
  ) {
  }

  ngOnInit() {
    this.refreshPhotoInfo();
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes && changes['photo']) {
      let change = changes['photo'];
      if(change.currentValue != null) {
        console.log('photoInfoComponent: Got photo change: ', change.currentValue);
        this.refreshPhotoInfo();
      }
    }
  }

  refreshPhotoInfo() {
    let tagsById = this.tagService.getTag$forIds(this.photo.tags);
    let tagArr = [];
    console.log('photoInfoComponent: retrieved tag subjects1 as ', tagsById);
    Object.keys(tagsById).forEach((k) => {
      let tag = tagsById[k];
      tagArr.push(tag);
    });
    //TODO: should probably sort the tags
    this.tagSubjs = tagArr;
    //console.log("Photo: retrieved tag subjects as ", this.tagSubjs);
  }

  keyShowMore(evt) {
    if (this.zoomLevel === 1.0) {
      this.showMore(evt);
    }
  }

  showMore(evt) {
    if (this.displayStatus === 'minimized') {
      this.displayStatus = 'single-line';
    } else if (this.displayStatus === 'single-line') {
      this.displayStatus = 'full1';
    }
  }

  keyShowLess(evt) {
    if (this.zoomLevel === 1.0) {
      this.showLess(evt);
    }
  }

  showLess(evt) {
    if (this.displayStatus === 'single-line') {
      this.displayStatus = 'minimized';
    } else if (this.displayStatus === 'full1') {
      this.displayStatus = 'single-line';
    }
  }

}
