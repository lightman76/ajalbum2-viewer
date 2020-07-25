import {Injectable} from "@angular/core";

@Injectable()
export class ConfigService {

  getApiRoot() {
    return "/photos/api";
  }

  getFullHost() {
    return "https://local.scrible.com";
  }

}
