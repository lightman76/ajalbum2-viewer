import {UserInfo} from './user-info';

export class SignedInUsersInfo {
  userInfosByName: { [key: string]: UserInfo };

  constructor() {
    this.userInfosByName = {};
  };

  addUserInfo(userInfo: UserInfo) {
    this.userInfosByName[userInfo.userName] = userInfo;
  }

  removeUserInfo(userName: string) {
    delete this.userInfosByName[userName];
  }
}
