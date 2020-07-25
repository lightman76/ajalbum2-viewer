import {Component, Input} from "@angular/core";
import {Photo} from "../../helper/photo";

@Component({
  selector: 'photo-thumb',
  template: `
    <div class="photo-thumb">
      {{photo.title}}
    </div>
  `,
  styles: [`
    .photo-thumb {
      box-sizing: border-box;
      border: 1px solid #666;
      width: 250px;
      height: 250px;
    }
  `],
})
export class PhotoThumbComponent {
  @Input() photo:Photo;

  constructor() {}

  ngOnInit() {
  }
}
