import {Component, ElementRef, EventEmitter, Input, Output, SimpleChanges, ViewChild} from '@angular/core';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {FormBuilder, FormControl} from '@angular/forms';
import {faBook, faCalendar, faMapMarkerAlt, faSearch, faTag, faTimes, faUser} from '@fortawesome/pro-solid-svg-icons';
import {SearchQuery} from '../../services/helper/search-query';
import {SearchTerm} from './search-term';
import {MatChipInputEvent} from '@angular/material/chips';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {map, startWith} from 'rxjs/operators';
import {ITag} from '../../services/helper/i-tag';
import {Observable} from 'rxjs';
import {TagService} from '../../services/tag.service';

@Component({
  selector: 'photo-search',
  template: `
    <div class="search-container">
      <form [formGroup]="searchForm" (ngSubmit)="runSearch($event)">
        <mat-form-field>
          <mat-label>Search</mat-label>
          <mat-chip-list #tagChipList aria-label="Search tags">
            <mat-chip *ngFor="let term of searchTerms"
                      (removed)="removeSearchTerm(term)">
              <fa-icon [icon]="term.getIconForType()"></fa-icon>&nbsp;
              {{term.displayName}}
              <button matChipRemove>
                <fa-icon [icon]="faTimes"></fa-icon>
              </button>
            </mat-chip>
            <input
              placeholder="Search"
              #searchInput
              [formControl]="searchForm"
              [matAutocomplete]="auto"
              [matChipInputFor]="tagChipList"
              [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
              (matChipInputTokenEnd)="addSearchTerm($event)">
            <button mat-icon-button color="primary" matSuffix aria-label="Search" type="button"
                    *ngIf="searchTerms.length === 0 && searchInput.value.length === 0">
              <fa-icon [icon]="faSearch"></fa-icon>
            </button>
            <button mat-icon-button color="primary" matSuffix aria-label="Clear" type="button"
                    *ngIf="searchTerms.length !== 0 || searchInput.value.length !== 0" (click)="clearForm($event)">
              <fa-icon [icon]="faTimes"></fa-icon>
            </button>
          </mat-chip-list>
          <mat-autocomplete #auto="matAutocomplete" (optionSelected)="addSelectedTag($event)">
            <mat-option *ngFor="let tagSearchTerm of filterTags | async" [value]="tagSearchTerm">
              <fa-icon [icon]="getIconForType(tagSearchTerm)"></fa-icon>&nbsp;
              {{tagSearchTerm.name}}
            </mat-option>
          </mat-autocomplete>
        </mat-form-field>
      </form>
    </div>
  `,
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {
  faSearch = faSearch;
  faTimes = faTimes;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  @Input() searchQuery: SearchQuery = null;
  @Output() searchUpdated: EventEmitter<SearchQuery>;
  searchForm;
  searchTerms: Array<SearchTerm>;
  filteredSearchTerms: Array<SearchTerm>;
  idCtr = new Date().getTime();
  allTags: Array<ITag>;
  filterTags: Observable<Array<ITag>>;
  lastUserName: string = null;
  JSON = JSON;

  partialSearchTerm: string = '';

  @ViewChild('searchInput') searchInput: ElementRef<HTMLInputElement>;


  constructor(private formBuilder: FormBuilder,
              private tagService: TagService) {
    this.searchForm = new FormControl();
    /*
        this.searchForm = this.formBuilder.group({
          searchTerms: [this.searchQuery ? this.searchQuery.searchText : ''],
        });
    */
    this.searchUpdated = new EventEmitter<SearchQuery>();
    this.searchTerms = [];
    this.allTags = [];
    this.filterTags = this.searchForm.valueChanges.pipe(
      startWith(null),
      map((name: string | null) => (name ? this._filter(name) : this.allTags.slice())),
    );
  }

  ngOnInit() {
    if (this.searchQuery && this.searchQuery.userName) {
      this.tagService.getAllTags(this.searchQuery.userName).then((tags) => {
        this.allTags = tags.map((t) => t.getValue());
        this.updateSearchTermsFromQuery();
      }, (err) => {
        console.error('Failure retrieving tags: ', err);
      });
    }

    this.updateSearchTermsFromQuery();
  }

  updateSearchTermsFromQuery() {
    if (this.searchQuery) {
      //console.log("  UpdateSearchTerms from Query: tagsLoaded="+this.allTags.length,this.searchQuery.searchText,this.searchQuery.tagIds)
      this.searchTerms = [];
      if (this.searchQuery.tagIds) {
        this.searchQuery.tagIds.forEach((tagId) => {
          let tag = this.allTags.find((t) => {
            return t.id == tagId;
          });
          if (tag) {
            this.searchTerms.push(new SearchTerm(tag.id, tag.name, tag.tag_type));
          }
        });
      }
      if (this.searchQuery.searchText) {
        this.searchTerms.push(new SearchTerm(this.idCtr++, this.searchQuery.searchText, 'search'));
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    let searchQueryChanges = changes['searchQuery'];
    if (searchQueryChanges) {
      //console.log("Got searchQuery change query=" + JSON.stringify(searchQueryChanges.currentValue));
      //console.log("  input current query form =" + JSON.stringify(this.searchForm.value.searchTerms));
      setTimeout(() => {
        if (searchQueryChanges.currentValue && searchQueryChanges.currentValue.searchText !== this.searchInput.nativeElement.value) {
          this.searchForm.setValue(searchQueryChanges.currentValue.searchText);
        }
      }, 50);
      if (searchQueryChanges.currentValue && searchQueryChanges.currentValue.userName && searchQueryChanges.currentValue.userName !== this.lastUserName) {
        this.tagService.getAllTags(searchQueryChanges.currentValue.userName).then((tags) => {
          this.allTags = tags.map((t) => t.getValue());
        }, (err) => {
          console.error('Failure retrieving tags: ', err);
        });
      }
    }
  }

  addSelectedTag(evt: MatAutocompleteSelectedEvent): void {
    let tag = <ITag> <any> evt.option.value;
    //(<any>window).fooo = evt.option;
    //console.log("  Adding selected tag term 2 ",JSON.stringify(tag));
    let term = this.searchTerms.find((st) => {
      return st.id === tag.id;
    });
    if (!term) {
      this.searchTerms.push(new SearchTerm(tag.id, tag.name, tag.tag_type));
    }
    this.searchInput.nativeElement.value = '';
    this.searchForm.setValue('');
    this.runSearch(null);
  }

  addSearchTerm(evt: MatChipInputEvent) {
    const value = (evt.value || '').trim();
    if (value) {
      if ((<any> value).tag_type) {
        let tag = <ITag> <any> value;
        // console.log("  Adding selected tag term ",tag);
        //ensure tag not already in query
        let term = this.searchTerms.find((st) => {
          return st.id === tag.id;
        });
        if (!term) {
          this.searchTerms.push(new SearchTerm(tag.id, tag.name, tag.tag_type));
        }
      } else {
        // console.log("  Adding text term tag ",value);
        let term = this.searchTerms.find((st) => {
          return st.termType === 'search';
        });
        if (term) {
          term.displayName += ' ' + value;
        } else {
          this.searchTerms.push(new SearchTerm(this.idCtr++, value, 'search'));
        }
        this.searchInput.nativeElement.value = '';
        this.searchForm.setValue('');
      }
      this.runSearch(null);
    }
  }

  removeSearchTerm(term) {
    const idx = this.searchTerms.findIndex((v) => v.id === term.id);
    if (idx >= 0) {
      this.searchTerms.splice(idx, 1);
      this.runSearch(null);
    }
  }

  runSearch(evt) {
    if (evt) {
      evt.stopPropagation();
      evt.preventDefault();
      evt.returnValue = false;
    }
    //console.log("Preparing to run search ", this.searchTerms);
    let textSearch = '';
    let tagIds = [];
    this.searchTerms.forEach((t) => {
      if (t.termType === 'search') {
        textSearch += t.displayName + ' ';
      } else {
        tagIds.push(t.id);
      }
    });
    let newQuery = this.searchQuery.clone();
    newQuery.searchText = textSearch;
    newQuery.tagIds = tagIds;
    this.searchUpdated.emit(newQuery);
  }

  clearForm(evt) {
    this.searchForm.setValue('');
    this.searchTerms = [];
    this.runSearch(null);
  }

  getIconForType(tag: ITag) {
    if (tag.tag_type === 'tag') {
      return faTag;
    } else if (tag.tag_type === 'location') {
      return faMapMarkerAlt;
    } else if (tag.tag_type === 'album') {
      return faBook;
    } else if (tag.tag_type === 'people') {
      return faUser;
    } else if (tag.tag_type === 'event') {
      return faCalendar;
    }
    return faTag;
  }

  private _filter(value: string | ITag): ITag[] {
    if (!value) {
      return this.allTags;
    }

    const filterValue = (<any> value).name ? (<ITag> value).name.toLowerCase() : (<string> value).toLowerCase();

    return this.allTags.filter(tag => tag.name ? tag.name.toLowerCase().includes(filterValue) : false);
  }

}
