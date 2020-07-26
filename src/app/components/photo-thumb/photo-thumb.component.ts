import {Component, Input} from "@angular/core";
import {Photo} from "../../helper/photo";

@Component({
  selector: 'photo-thumb',
  template: `
    <div class="photo-thumb">
      <img
        [attr.src]="'storage/'+photo.image_versions['thumb'].root_store+'/'+photo.image_versions['thumb'].relative_path"
        [attr.alt]="photo.title">
    </div>
  `,
  styles: [`
    .photo-thumb {
      box-sizing: border-box;
      border: 1px solid #666;
      width: 250px;
      height: 250px;
    }

    .photo-thumb img {
      width: 100%;
      height: 100%;
    }

  `],
})
export class PhotoThumbComponent {
  @Input() photo:Photo;

  constructor() {}

  ngOnInit() {
  }
}
