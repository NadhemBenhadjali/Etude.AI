import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
@Component({
  selector: 'app-select-mode',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AvatarComponent],
  templateUrl: './select-mode.component.html',
  styleUrls: ['./select-mode.component.css']
})
export class SelectModeComponent {
  selectedMode: string = '';

  constructor(private router: Router) {}

  selectMode(mode: string) {
  this.selectedMode = mode;

  if (mode === 'general') {
    this.router.navigate(['/chatbot'], ); 
  } 
  else{
    this.router.navigate(['/select-module'], {
      queryParams: { mode: mode }
    });
  }}

}