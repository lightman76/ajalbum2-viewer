import {Component} from '@angular/core';
import {faToggleOff, faToggleOn} from '@fortawesome/pro-solid-svg-icons';
import {UserService} from '../../services/user.service';
import {UserInfo} from '../../services/helper/user-info';
import {MatDialog} from '@angular/material/dialog';
import {SelectionService} from '../../services/selection.service';

@Component({
  selector: 'photo-selection-toggle',
  template: `
    <div class="photo-selection-toggle"
         [class.loggedIn]="!!currentUser"
         tabindex="0">
      <fa-icon
        (click)="toggleSelection($event)"
        [matTooltip]="toggleState ? 'Photo selection enabled' : 'Photo selection disabled'"
        [matTooltipPosition]="'left'"
        [icon]="toggleState ? faToggleOn : faToggleOff"
        [size]="'2x'"></fa-icon>
    </div>
  `,
  styles: [`
    .photo-selection-toggle {
      box-sizing: border-box;
      width: 50px;
      height: 50px;
      padding: 30px 10px 10px 10px;
      color: #888;
      display: none;
    }

    .photo-selection-toggle.loggedIn {
      display: inline-block;
    }
  `],
})
export class PhotoSelectionToggle {
  faToggleOn = faToggleOn;
  faToggleOff = faToggleOff;

  toggleState: boolean = false;
  currentUser: UserInfo = null;

  constructor(private userService: UserService,
              private selectionService: SelectionService,
              private dialog: MatDialog) {
  }

  ngOnInit() {
    this.userService.getCurrentUser$().subscribe((currentUser) => {
      this.currentUser = currentUser;
    });
    this.selectionService.getSelectionEnabled$().subscribe((selectionEnabled) => {
      this.toggleState = selectionEnabled;
    });
  }

  toggleSelection(evt) {
    evt.preventDefault();
    if (this.toggleState) {
      this.selectionService.getSelectionEnabled$().next(false);
      this.selectionService.clearSelections();
    } else {
      this.selectionService.getSelectionEnabled$().next(true);
    }
  }


}
