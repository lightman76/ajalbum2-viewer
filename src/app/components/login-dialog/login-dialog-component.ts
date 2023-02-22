import {Component} from '@angular/core';
import {faUser} from '@fortawesome/pro-solid-svg-icons';
import {UserService} from '../../services/user.service';
import {UserInfo} from '../../services/helper/user-info';
import {MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'login-dialog',
  template: `
    <h2 mat-dialog-title>Login</h2>
    <div mat-dialog-content class="mat-typography">
      <form (submit)="onSubmit($event, usernameInput, passwordInput)">
        <mat-form-field appearance="fill">
          <mat-label>Username</mat-label>
          <input
            placeholder="Username"
            autocomplete="username"
            #usernameInput
            matInput>
        </mat-form-field>
        <mat-form-field appearance="fill">
          <mat-label>Password</mat-label>
          <input
            placeholder="password"
            autocomplete="current-password"
            #passwordInput
            type="password"
            matInput>
        </mat-form-field>
        <div class="mdc-touch-target-wrapper">
          <button class="mdc-button mdc-button--touch" type="submit">
            <span class="mdc-button__ripple"></span>
            <span class="mdc-button__touch"></span>
            <span class="mdc-button__label">Login</span>
          </button>
        </div>
        <div class="mdc-touch-target-wrapper">
          <button class="mdc-button mdc-button--touch" type="button" (click)="dialogRef.close()">
            <span class="mdc-button__ripple"></span>
            <span class="mdc-button__touch"></span>
            <span class="mdc-button__label">Cancel</span>
          </button>
        </div>
      </form>
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
export class LoginDialogComponent {
  faUser = faUser;

  usernameField = null;
  passwordField = null;

  constructor(public dialogRef: MatDialogRef<LoginDialogComponent>,
              private userService: UserService,
              private matSnackBar: MatSnackBar) {
  }

  ngOnInit() {
  }

  onSubmit(evt, username, password) {
    if (evt) {
      evt.preventDefault();
    }
    if (!username.value || !password.value) {
      this.matSnackBar.open('Please provide a username and password', 'Dismiss', {
        duration: 5000
      });
    }
    this.userService.loginUser(username.value, password.value).then((userInfo: UserInfo) => {
      this.matSnackBar.open('Successfully logged in', 'Dismiss', {
        duration: 2000
      });
      this.dialogRef.close({userInfo: userInfo});
    }, (reason: any) => {
      this.matSnackBar.open('Invalid username or password.', 'Dismiss', {
        duration: 5000
      });
    });
  }
}
