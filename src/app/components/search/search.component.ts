import {Component, ElementRef, EventEmitter, Input, Output, SimpleChanges, ViewChild} from '@angular/core';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {UntypedFormBuilder, UntypedFormControl} from '@angular/forms';
import {faSearch, faTimes} from '@fortawesome/pro-solid-svg-icons';
import {SearchQuery} from '../../services/helper/search-query';
import {SearchTerm} from './search-term';
import {map, startWith} from 'rxjs/operators';
import {ITag} from '../../services/helper/i-tag';
import {Observable} from 'rxjs';
import {TagService} from '../../services/tag.service';
import {AJHelpers} from '../../services/helper/ajhelpers';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatChipInputEvent} from '@angular/material/chips';

@Component({
  selector: 'photo-search',
  template: `
    <div class="search-container">
      <form [formGroup]="searchForm" (ngSubmit)="runSearch($event)">
        <mat-form-field appearance="fill">
          <mat-label>Search</mat-label>
          <mat-chip-grid #tagChipGrid aria-label="Search tags">
            <mat-chip-row *ngFor="let term of searchTerms"
                          [editable]="false"
                          (removed)="removeSearchTerm(term)">
              <fa-icon [icon]="term.getIconForType()"></fa-icon>&nbsp;
              {{term.displayName}}
              <button matChipRemove [attr.aria-label]="'remove search term '+term.displayName">
                <fa-icon [icon]="faTimes"></fa-icon>
              </button>
            </mat-chip-row>
            <input
              placeholder="Search"
              #searchInput
              [formControl]="searchForm"
              [matAutocomplete]="auto"
              [matChipInputFor]="tagChipGrid"
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
          </mat-chip-grid>
          <mat-autocomplete #auto="matAutocomplete" (optionSelected)="addSelectedTag($event)">
            <div class="search-date-filters">
              <div class="search-date-filter search-date-filter-end">
                <mat-form-field appearance="fill">
                  <mat-label>End Date</mat-label>
                  <input
                    matInput
                    (dateInput)="onEndDateChange($event)"
                    [value]="endDate"
                    [matDatepicker]="endPicker">
                  <mat-hint>MM/DD/YYYY</mat-hint>
                  <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                  <mat-datepicker #endPicker></mat-datepicker>
                </mat-form-field>
              </div>
              <div class="search-date-filter search-date-filter-start">
                <mat-form-field appearance="fill">
                  <mat-label>Start Date</mat-label>
                  <input
                    matInput
                    (dateInput)="onStartDateChange($event)"
                    [value]="startDate"
                    [matDatepicker]="startPicker">
                  <mat-hint>MM/DD/YYYY</mat-hint>
                  <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>

                  <mat-datepicker #startPicker></mat-datepicker>
                </mat-form-field>
              </div>
            </div>
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

  startDate: Date | null = null;
  endDate: Date | null = null;
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


  constructor(private formBuilder: UntypedFormBuilder,
              private tagService: TagService) {
    this.searchForm = new UntypedFormControl();
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
        this.searchForm.valueChanges.next('');
      }, (err) => {
        console.error('Failure retrieving tags: ', err);
      });
    }
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
      if (this.searchQuery.startDate) {
        this.startDate = AJHelpers.parseDashedDate(this.searchQuery.startDate);
      }
      if (this.searchQuery.endDate) {
        this.endDate = AJHelpers.parseDashedDate(this.searchQuery.endDate);
      }
      this.refreshDateTerm();
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
      if (term.termType === 'date') {
        this.startDate = null;
        this.endDate = null;
      }
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
    let textSearch = null;
    let tagIds = null;
    let startDate = null;
    let endDate = null;
    this.searchTerms.forEach((t) => {
      if (t.termType === 'search' && t.displayName != '') {
        textSearch = (textSearch || '') + t.displayName + ' ';
      } else if (t.termType === 'date') {
        startDate = this.startDate;
        endDate = this.endDate;
      } else {
        if (!tagIds) {
          tagIds = [];
        }
        tagIds.push(t.id);
      }
    });
    let newQuery = this.searchQuery.clone();
    newQuery.searchText = textSearch;
    newQuery.tagIds = tagIds;
    newQuery.startDate = startDate;
    newQuery.endDate = endDate;
    newQuery.offsetDate = null;
    this.searchUpdated.emit(newQuery);
  }

  clearForm(evt) {
    this.searchForm.setValue('');
    this.searchTerms = [];
    this.runSearch(null);
  }

  clearStartDate(evt) {
    this.startDate = null;
    this.refreshDateTerm();
  }

  clearEndDate(evt) {
    this.endDate = null;
    this.refreshDateTerm();
  }

  onStartDateChange(evt) {
    if (typeof evt.targetElement.value !== 'string') {
      this.startDate = evt.targetElement.value;
      this.refreshDateTerm();
    } else {
      try {
        let d = new Date(evt.targetElement.value);
        this.startDate = d;
        this.refreshDateTerm();
      } catch (e) {
        console.log('Failed to parse date', e);
      }
    }
  }

  onEndDateChange(evt) {
    if (typeof evt.targetElement.value !== 'string') {
      this.endDate = evt.targetElement.value;
      this.refreshDateTerm();
    } else {
      try {
        let d = new Date(evt.targetElement.value);
        this.endDate = d;
        this.refreshDateTerm();
      } catch (e) {
        console.log('Failed to parse date', e);
      }
    }
  }

  refreshDateTerm() {
    const startTerm: Date = this.startDate;
    const endTerm: Date = this.endDate;
    let term = this.searchTerms.find((t) => t.termType === 'date');
    if (term) {
      if (startTerm === null && endTerm === null) {
        const idx = this.searchTerms.indexOf(term);
        this.searchTerms.splice(idx, 1);
        return;
      }
    } else {
      if (startTerm !== null || endTerm !== null) {
        term = new SearchTerm(this.idCtr++, '', 'date');
        this.searchTerms.push(term);
      }
    }
    if (term) {
      let displayName = null;
      if (startTerm && !endTerm) {
        displayName = 'After ' + this.formatDashedDate(startTerm);
      } else if (!startTerm && endTerm) {
        displayName = 'Before ' + this.formatDashedDate(endTerm);
      } else if (startTerm && endTerm) {
        displayName = 'Between ' + this.formatDashedDate(startTerm) + ' and ' + this.formatDashedDate(endTerm);
      }
      term.displayName = displayName;
    }
    this.runSearch(null);
  }

  formatDashedDate(date) {
    return AJHelpers.formatDashedDate(date);
  }

  getIconForType(tag: ITag) {
    return AJHelpers.getIconForType(tag);
  }

  private _filter(value: string | ITag): ITag[] {
    if (!value) {
      return this.allTags;
    }

    const filterValue = (<any> value).name ? (<ITag> value).name.toLowerCase() : (<string> value).toLowerCase();

    return this.allTags.filter(tag => tag.name ? tag.name.toLowerCase().includes(filterValue) : false);
  }

}
