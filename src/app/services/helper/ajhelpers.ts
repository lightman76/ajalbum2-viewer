export class AJHelpers {
  static formatDashedDate(date) {
    if (!date) {
      return null;
    }
    if (typeof date === 'string') {
      return date;
    }
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
  }

  static parseDashedDate(dateStr) {
    return new Date(dateStr);
  }

  static equalDates(a, b) {
    if (a === b) {
      return true;
    }
    if (!a && b || !b && a) {
      return false;
    }
    return a.getTime() === b.getTime();
  }

}
