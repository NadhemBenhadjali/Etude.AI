import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
@Component({
  selector: 'app-about',
   standalone: true,
  imports: [CommonModule , RouterModule, AvatarComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {

}
