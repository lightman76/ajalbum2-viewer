import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {PhotoService} from '../../services/photo.service';

@Component({
  selector: 'default-user',
  template: `
  `,
  styles: [`
`],
})
export class DefaultUserComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private photoService: PhotoService,
  ) {
  }

  ngOnInit() {
    // For now hardcode the default user - later, look this up from the server
    this.router.navigate(["andy/list"], {relativeTo: this.route});
  }

}
