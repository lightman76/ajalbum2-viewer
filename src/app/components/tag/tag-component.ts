import {Component, Input} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {ITag} from "../../services/helper/i-tag";
import {faBook, faEnvelope, faLocation, faTag, faUser} from "@fortawesome/pro-solid-svg-icons";

@Component({
  selector: 'tag',
  template: `
    <div class="tag-container" *ngIf="tagSubject.getValue() && tagSubject.getValue().tag_type != 'loading'">
      <fa-icon [icon]="tagIcon"></fa-icon>
      {{tagSubject.getValue().name}}
    </div>
  `,
  styles: [`
    .tag-container {
      display: inline-block;
      border: 1px solid #666;
      background-color: #eee;
      color: #333;
      padding: 2px 5px;
      break-inside: avoid;
      border-radius: 4px;
      margin: 0 5px 0 0;
    }
  `],
})

export class TagComponent {
  @Input() tagSubject: BehaviorSubject<ITag>;
  tagIcon = faTag;

  constructor() {
  }

  ngOnInit() {
    this.processTagInfo();
    this.tagSubject.subscribe(() => {
      this.processTagInfo();
    });
  }


  processTagInfo() {
    let tag = this.tagSubject.getValue();
    if (tag && tag.tag_type) {
      if (tag.tag_type === 'tag') {
        this.tagIcon = faTag;
      } else if (tag.tag_type === 'people') {
        this.tagIcon = faUser;
      } else if (tag.tag_type === 'location') {
        this.tagIcon = faLocation;
      } else if (tag.tag_type === 'event') {
        this.tagIcon = faEnvelope;
      } else if (tag.tag_type === 'album') {
        this.tagIcon = faBook;
      }
    }
  }


}
