import {Injectable} from '@angular/core';
import {ConfigService} from './config.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {UserInfo} from './helper/user-info';
import {BehaviorSubject} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {AJHelpers} from './helper/ajhelpers';

@Injectable()
export class UserService {
  currentUser$: BehaviorSubject<UserInfo>;

  constructor(private configService: ConfigService,
              private http: HttpClient) {
    this.currentUser$ = new BehaviorSubject<UserInfo>(null);
    this.loadFromLocalStorage();
  }

  getCurrentUser$() {
    return this.currentUser$;
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
        this.currentUser$.next(userInfo);
        resolve(userInfo);
      }, (err) => {
        if (this.currentUser$.getValue()) {
          this.updateLocalStorage(null, null);
          this.currentUser$.next(null);
        }
        reject(err);
      });
    });


    return p;
  }

  logoutUser() {
    this.updateLocalStorage(null, null);
    this.currentUser$.next(null);
  }

  private updateLocalStorage(username, userInfo) {
    if (userInfo) {
      localStorage.setItem('username', username);
      localStorage.setItem('loginAuthToken', userInfo.authenticationToken);
    } else {
      localStorage.removeItem('username');
      localStorage.removeItem('loginAuthToken');
    }
  }

  private loadFromLocalStorage() {
    let username = localStorage.getItem('username');
    let token = localStorage.getItem('loginAuthToken');
    if (username && token) {
      //TODO: Need to check date on token to ensure still valid...
      this.currentUser$.next(new UserInfo(username, token));
    } else {
      this.currentUser$.next(null);
    }
  }
}
