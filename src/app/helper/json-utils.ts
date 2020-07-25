export class JsonUtils {
  public static parseJsonDate(dStr:string) {
    if(dStr == null) return null;
    try {
      return new Date(dStr);
    } catch (e) {
      return null;
    }
  }
}
