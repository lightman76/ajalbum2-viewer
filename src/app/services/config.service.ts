import {Injectable} from '@angular/core';

@Injectable()
export class ConfigService {

  getApiRoot() {
    return '/photos/api';
  }

  getApiUserRoot(userName) {
    return '/photos/api/' + userName;
  }

  getFullHost() {
    return 'https://local.scrible.com';
  }

}
