import {Component, EventEmitter, Input, Output} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {ITag} from '../../services/helper/i-tag';
import {faTag} from '@fortawesome/pro-solid-svg-icons';
import {IconDefinition} from '@fortawesome/pro-regular-svg-icons';
import {AJHelpers} from '../../services/helper/ajhelpers';

@Component({
  selector: 'tag',
  template: `
    <div class="tag-container" *ngIf="tagSubject.getValue() && tagSubject.getValue().tag_type != 'loading'">
      <fa-icon [icon]="tagIcon"></fa-icon>
      {{tagSubject.getValue().name}}
      <div class="tag-actions-container">
        <div class="tag-action" *ngFor="let tagAction of tagActions" (click)="handleTagAction($event, tagAction)">
          <fa-icon [icon]="tagAction.icon" [matTooltip]="tagAction.actionTooltip"></fa-icon>
        </div>
      </div>
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

    .tag-actions-container {
      display: inline-block;

    }

    .tag-action {
      display: inline-block;
      color: blue;
      margin-left: 5px;
    }

    .tag-action:hover {
      color: darkblue;
    }
  `],
})

export class TagComponent {
  @Input() tagSubject: BehaviorSubject<ITag>;
  @Input() tagActions: Array<TagActionInfo>;
  @Output() tagActionHandler: EventEmitter<TagActionEvent>;
  tagIcon = faTag;

  constructor() {
    this.tagActionHandler = new EventEmitter<TagActionEvent>();
  }

  ngOnInit() {
    if (!this.tagActions) {
      this.tagActions = [];
    }
    this.processTagInfo();
    this.tagSubject.subscribe(() => {
      this.processTagInfo();
    });
  }


  processTagInfo() {
    let tag = this.tagSubject.getValue();
    if (tag && tag.tag_type) {
      this.tagIcon = AJHelpers.getIconForTagType(tag.tag_type);
    }
  }

  handleTagAction(evt, tagAction) {
    //TODO
    evt.preventDefault();
    this.tagActionHandler.emit(new TagActionEvent(this.tagSubject.getValue(), tagAction));
  }


}

export class TagActionInfo {
  actionEventName: string;
  actionTooltip: string;
  icon: IconDefinition;

  constructor(actionEventName: string = null, actionTooltip: string = null, icon: IconDefinition = null) {
    this.actionEventName = actionEventName;
    this.actionTooltip = actionTooltip;
    this.icon = icon;
  }
}

export class TagActionEvent {
  tag: ITag;
  tagAction: TagActionInfo;

  constructor(tag, tagAction) {
    this.tag = tag;
    this.tagAction = tagAction;
  }
}
