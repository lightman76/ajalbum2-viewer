import {Injectable} from '@angular/core';
import {ConfigService} from './config.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {UserInfo} from './helper/user-info';
import {BehaviorSubject} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {AJHelpers} from './helper/ajhelpers';
import {SignedInUsersInfo} from './helper/signed-in-users-info';

@Injectable()
export class UserService {
  currentUsersInfo$: BehaviorSubject<SignedInUsersInfo>;

  constructor(private configService: ConfigService,
              private http: HttpClient) {
    this.currentUsersInfo$ = new BehaviorSubject<SignedInUsersInfo>(new SignedInUsersInfo());
    this.loadFromLocalStorage();
  }

  getCurrentUsers$() {
    return this.currentUsersInfo$;
  }

  hasAccessToUser(currentUser: UserInfo, onBehalfOfUser: string) {
    if (!currentUser) {
      return false;
    }
    //In the future, may have permissions or something that lets other users access multiple albums
    return currentUser.userName === onBehalfOfUser;
  }

  loginUser(username, password) {
    console.log('Preparing to login user ' + username);
    let p = new Promise<UserInfo>((resolve, reject) => {
      let headers = new HttpHeaders({'Content-Type': 'application/json'});
      let req = this.http.post<UserInfo>(this.configService.getApiRoot() + '/' + username + '/authenticate',
        JSON.stringify({
          password: password
        }),
        {headers: headers}).pipe(catchError(AJHelpers.errorHandler));
      req.subscribe((data) => {
        let userInfo = new UserInfo(username, data['token']);
        this.updateLocalStorage(username, userInfo);
        resolve(userInfo);
      }, (err) => {
        this.updateLocalStorage(username, null);
        reject(err);
      });
    });

    return p;
  }

  logoutUser(username: string = null) {
    if (username) {
      //just log out this user
      this.updateLocalStorage(username, null);
    } else {
      //log out of all users
      let usernamesStr = localStorage.getItem('usernames');
      if (usernamesStr) {
        let usernames = JSON.parse(usernamesStr);
        usernames.forEach((username) => {
          this.updateLocalStorage(username, null);
        });
      }
    }
  }

  private updateLocalStorage(username, userInfo: UserInfo) {
    if (userInfo) {
      let usernamesStr = localStorage.getItem('usernames');
      let usernames = [];
      if (usernamesStr) {
        usernames = JSON.parse(usernamesStr);
      }
      if (usernames.indexOf(username) < 0) {
        usernames.push(username);
        localStorage.setItem('usernames', JSON.stringify(usernames));
      }
      localStorage.setItem('loginAuthToken_' + username, userInfo.authenticationToken);
      let signedInUsers = this.currentUsersInfo$.getValue();
      signedInUsers.addUserInfo(userInfo);
      this.currentUsersInfo$.next(signedInUsers);
    } else {
      localStorage.removeItem('loginAuthToken_' + username);
      let usernamesStr = localStorage.getItem('usernames');
      if (usernamesStr) {
        let usernames = JSON.parse(usernamesStr);
        let idx = usernames.indexOf(username);
        if (idx >= 0) {
          usernames.splice(idx, 1);
          localStorage.setItem('usernames', JSON.stringify(usernames));
        }
      }
      let signedInUsers = this.currentUsersInfo$.getValue();
      signedInUsers.removeUserInfo(username);
      this.currentUsersInfo$.next(signedInUsers);

    }
  }

  private loadFromLocalStorage() {
    let usernamesStr = localStorage.getItem('usernames');
    let usernames = [];
    let invalidNames = [];
    let signedInUsersInfo = new SignedInUsersInfo();
    if (usernamesStr) {
      usernames = JSON.parse(usernamesStr);
    }
    usernames.forEach((username) => {
      let token = localStorage.getItem('loginAuthToken_' + username);
      if (username && token) {
        //TODO: Need to check date on token to ensure still valid...
        let parsedToken = this.jwtDecode(token);
        if (parsedToken.payload.aud !== 'AJAlbumServer' ||
          parsedToken.payload.iss !== 'AJAlbumServer' ||
          parsedToken.payload.exp < new Date().getTime() / 1000
        ) {
          //invalid JWT - remove from storage
          invalidNames.push(username);
        } else {
          //Valid - add it to the list
          signedInUsersInfo.addUserInfo(new UserInfo(username, token));
        }
      }
    });
    if (invalidNames.length > 0) {
      invalidNames.forEach((invalidName) => {
        let idx = usernames.indexOf(invalidName);
        if (idx >= 0) {
          usernames.splice(idx, 1);
        }
        localStorage.removeItem('loginAuthToken_' + invalidName);
      });
      localStorage.setItem('usernames', JSON.stringify(usernames));
    }
    this.currentUsersInfo$.next(signedInUsersInfo);
  }

  private jwtDecode(t) {
    try {
      let token: JwtToken = new JwtToken();
      token.raw = t;
      token.header = JSON.parse(window.atob(t.split('.')[0]));
      token.payload = JSON.parse(window.atob(t.split('.')[1]));
      return (token);
    } catch (e) {
      console.warn('Tried to parse invalid JWT', e);
      return null;
    }
  }
}


export class JwtToken {
  raw: string;
  header: any;
  payload: any;
}
