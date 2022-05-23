import {Component, EventEmitter, Input, Output, SimpleChanges} from "@angular/core";
import {FormBuilder} from "@angular/forms";
import {faSearch, faTimes} from "@fortawesome/pro-solid-svg-icons";
import {SearchQuery} from "../../services/helper/search-query";

@Component({
  selector: 'photo-search',
  template: `
    <div class="search-container">
      <form [formGroup]="searchForm" (ngSubmit)="runSearch($event, searchForm.value)">
        <mat-form-field>
          <mat-label>Search</mat-label>
          <input matInput type="search" formControlName="searchTerms">
          <button mat-icon-button color="primary" matSuffix aria-label="Search" type="submit" *ngIf="!searchForm.value.searchTerms">
            <fa-icon [icon]="faSearch"></fa-icon>
          </button>
          <button mat-icon-button color="accent" *ngIf="searchForm.value.searchTerms" matSuffix aria-label="Clear"
                  (click)="clearForm($event, searchForm.value)">
            <fa-icon [icon]="faTimes"></fa-icon>
          </button>
        </mat-form-field>
      </form>
    </div>
  `,
  styles: [`
    .search-container {
      padding-left: 10px;
      padding-right: 10px;
    }

    .search-container mat-form-field {
      width: 500px;
      max-width: calc(100vw - 20px);
    }
  `]
})
export class SearchComponent {
  faSearch = faSearch;
  faTimes = faTimes;
  @Input() searchQuery: SearchQuery = null;
  @Output() searchUpdated: EventEmitter<SearchQuery>;
  searchForm;

  constructor(private formBuilder: FormBuilder) {
    this.searchForm = this.formBuilder.group({
      searchTerms: [this.searchQuery ? this.searchQuery.searchText : ''],
    });
    this.searchUpdated = new EventEmitter<SearchQuery>();
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    let searchQueryChanges = changes['searchQuery'];
    if (searchQueryChanges) {
      console.log("Got searchQuery change query=" + JSON.stringify(searchQueryChanges.currentValue))
      console.log("  input current query form =" + JSON.stringify(this.searchForm.value.searchTerms))
      setTimeout(() => {
        if (searchQueryChanges.currentValue && searchQueryChanges.currentValue.searchText !== this.searchForm.value.searchTerms) {
          this.searchForm.get('searchTerms').setValue(searchQueryChanges.currentValue.searchText);
        }
      }, 50);
    }

  }


  runSearch(evt, formData) {
    if (evt) {
      evt.stopPropagation();
      evt.preventDefault();
      evt.returnValue = false;
    }
    console.log("Preparing to run search " + formData.searchTerms);
    let newQuery = this.searchQuery.clone();
    newQuery.searchText = formData.searchTerms;
    this.searchUpdated.emit(newQuery);
  }

  clearForm(evt, formData) {
    this.searchForm.get('searchTerms').setValue("");
    this.runSearch(null, formData);
  }
}
