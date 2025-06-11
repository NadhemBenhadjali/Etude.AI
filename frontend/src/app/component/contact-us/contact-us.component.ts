import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule , RouterModule, AvatarComponent],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css'
})
export class ContactUsComponent {

}
