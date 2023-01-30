export class UserInfo {
  userName: string = null;
  authenticationToken: string = null;

  constructor(userName, authenticationToken?) {
    this.userName = userName;
    this.authenticationToken = authenticationToken;
  }
}
