import {Component, Input} from '@angular/core';
import {faUser} from '@fortawesome/pro-solid-svg-icons';
import {UserService} from '../../services/user.service';
import {UserInfo} from '../../services/helper/user-info';
import {LoginDialogComponent} from '../login-dialog/login-dialog-component';
import {MatDialog} from '@angular/material/dialog';
import {SignedInUsersInfo} from '../../services/helper/signed-in-users-info';

@Component({
  selector: 'login-indicator',
  template: `
    <div class="login-indicator"
         [class.loggedIn]="!!currentUser"
         tabindex="0">
      <fa-icon
        (click)="toggleLogin($event)"
        [matTooltip]="currentUser ? ('Log out of '+currentUser.userName) : 'Log in'"
        [matTooltipPosition]="'below'"
        [icon]="faUser"
        [size]="'2x'"></fa-icon>
    </div>
  `,
  styles: [`
    .login-indicator {
      box-sizing: border-box;
      width: 50px;
      height: 50px;
      padding: 20px 10px 10px 10px;
      color: #888;
      display: inline-block;
    }

    .login-indicator.loggedIn {
      color: #3f51b5;
    }
  `],
})
export class LoginIndicatorComponent {
  faUser = faUser;

  @Input() public viewingUser: string = null;
  currentUsers: SignedInUsersInfo = null;
  currentUser: UserInfo = null;

  constructor(private userService: UserService,
              private dialog: MatDialog) {
  }

  ngOnInit() {
    this.userService.getCurrentUsers$().subscribe((currentUsers) => {
      this.currentUsers = currentUsers;
      this.currentUser = this.currentUsers.userInfosByName[this.viewingUser];

    });
  }

  toggleLogin(evt) {
    evt.preventDefault();
    if (this.currentUser) {
      //LOG OUT
      this.userService.logoutUser();
    } else {
      //NOT LOGGED IN
      const dialogRef = this.dialog.open(LoginDialogComponent, {
        width: '250px',
        data: {},
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
        this.currentUser = result ? result.userInfo : null;
      });
    }
  }


}
