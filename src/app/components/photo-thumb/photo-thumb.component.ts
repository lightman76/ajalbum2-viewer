import {Component, Input} from "@angular/core";
import {Photo} from "../../helper/photo";
import {Router} from "@angular/router";

@Component({
  selector: 'photo-thumb',
  template: `
    <div class="photo-thumb" (click)="onClick($event)">
      <img *ngIf="photo.image_versions['thumb']"
           [attr.src]="'storage/'+photo.image_versions['thumb'].root_store+'/'+photo.image_versions['thumb'].relative_path"
           [attr.alt]="photo.title">
    </div>
  `,
  styles: [`
    .photo-thumb {
      box-sizing: border-box;
      border: 1px solid #666;
      width: 100%;
      height: 100%;
      cursor: pointer;
      border-radius: 15px;
    }

    .photo-thumb img {
      border-radius: 15px;
      width: 100%;
      height: 100%;
    }

  `],
})
export class PhotoThumbComponent {
  @Input() photo: Photo;

  constructor(private router: Router) {
  }

  ngOnInit() {
  }

  onClick(evt) {
    console.log("Preparing to navigate: " + this.photo.time_id)
    this.router.navigateByUrl("/photo/" + this.photo.time_id);
  }
}
