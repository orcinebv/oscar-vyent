import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'ov-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, ToastComponent],
  template: `
    <a class="skip-link" href="#main-content">Naar inhoud</a>
    <ov-header />
    <main id="main-content">
      <router-outlet />
    </main>
    <ov-toast />
  `,
  styles: [`
    main {
      min-height: calc(100vh - var(--header-height));
      padding-top: var(--header-height);
    }
  `],
})
export class AppComponent {}
