import {Component} from '@angular/core';
import {faUser} from '@fortawesome/pro-solid-svg-icons';
import {UserService} from '../../services/user.service';
import {UserInfo} from '../../services/helper/user-info';

@Component({
  selector: 'login-indicator',
  template: `
    <div class="login-indicator"
         [class.loggedIn]="!!currentUser"
         tabindex="0">
      <fa-icon
        (click)="toggleLogin($event)"
        [matTooltip]="currentUser ? ('Log out of '+currentUser.userName) : 'Log in'"
        [matTooltipPosition]="'left'"
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
    }

    .login-indicator.loggedIn {
      color: #3f51b5;
    }
  `],
})
export class LoginIndicatorComponent {
  faUser = faUser;
  currentUser: UserInfo = null;

  constructor(private userService: UserService) {
  }

  ngOnInit() {
    this.userService.getCurrentUser$().subscribe((currentUser) => {
      this.currentUser = currentUser;
    });
  }

  toggleLogin(evt) {
    evt.preventDefault();
    //NOT IMPLEMENTED
  }


}
