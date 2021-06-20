import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'bio-medical-cloud';

  get getFullYear(): number {
    const date = new Date();
    return date.getFullYear();
  }
}
