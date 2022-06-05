import {Injectable} from '@angular/core';
import {ConfigService} from './config.service';
import {HttpClient} from '@angular/common/http';
import {UserInfo} from './helper/user-info';
import {BehaviorSubject} from 'rxjs';

@Injectable()
export class UserService {
  currentUser$: BehaviorSubject<UserInfo>;

  constructor(private configService: ConfigService,
              private http: HttpClient) {
    this.currentUser$ = new BehaviorSubject<UserInfo>(null);
  }

  getCurrentUser$() {
    return this.currentUser$;
  }

}
