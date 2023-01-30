import {faBook, faCalendar, faClock, faMapMarkerAlt, faSearch, faTag, faUser} from '@fortawesome/pro-solid-svg-icons';
import {IconDefinition} from '@fortawesome/pro-regular-svg-icons';

export class SearchTerm {
  public id: number;
  public displayName: string;
  public termType: string;

  constructor(id, displayName, termType) {
    this.id = id;
    this.displayName = displayName;
    this.termType = termType;
  }

  getIconForType(): IconDefinition {
    if (this.termType === 'search') {
      return faSearch;
    } else if (this.termType === 'tag') {
      return faTag;
    } else if (this.termType === 'location') {
      return faMapMarkerAlt;
    } else if (this.termType === 'album') {
      return faBook;
    } else if (this.termType === 'people') {
      return faUser;
    } else if (this.termType === 'event') {
      return faCalendar;
    } else if (this.termType === 'date') {
      return faClock;
    }
    return faTag;
  }

  toHash() {
    return ({
      id: this.id,
      displayName: this.displayName,
      termType: this.termType,
    });
  }

  toJSON() {
    return JSON.stringify(this.toHash());
  }
}
