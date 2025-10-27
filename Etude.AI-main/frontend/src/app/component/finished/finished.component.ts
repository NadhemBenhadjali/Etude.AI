import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AvatarComponent } from "../../shared/avatar/avatar.component";

const NGROK_BASE = environment.apiBase;
@Component({
  selector: 'app-finished',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './finished.component.html',
  styleUrls: ['./finished.component.css']
})
export class FinishedComponent {
  constructor(private router: Router) {}

  goHome() {
  fetch(`${NGROK_BASE}/finish`, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'true'  
    }
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => {
      let pdfUrl = data.pdf_url;
      if (!/^https?:\/\//i.test(pdfUrl)) {
        pdfUrl = NGROK_BASE.replace(/\/$/, '') + pdfUrl;
      }

      // Create temporary <a> element with "download"
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'session_report.pdf'; // suggested file name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Optionally navigate after download
      this.router.navigate(['/']);
    })
    .catch(err => {
      console.error('❌ Error fetching PDF URL:', err);
      this.router.navigate(['/']);
    });
}

  }