import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AvatarComponent } from '../../shared/avatar/avatar.component';

type FinishResponse = { pdf_url: string };

const BASE = environment.apiBase; // '/api/ai'

@Component({
  selector: 'app-finished',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './finished.component.html',
  styleUrls: ['./finished.component.css']
})
export class FinishedComponent {
  constructor(private router: Router) { }

  async goHome() {
    // Session is already saved in the previous step (ChatbotQuizComponent)
    // Just navigate to dashboard
    await this.router.navigate(['/dashboard']);
  }
}
