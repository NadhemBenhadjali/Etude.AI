import { Routes } from '@angular/router';
import { HomeComponent } from './component/home/home.component';
import { SigninComponent } from './component/signin/signin.component';
import { SignupComponent } from './component/signup/signup.component';
import { LandingComponent } from './component/landing-page/landing-page.component'; 
import { WelcomeComponent } from './component/welcome/welcome.component';
import { SelectClassComponent } from './component/select-class/select-class.component';
import { SelectSubjectComponent } from './component/select-subject/select-subject.component';
import { FinishedComponent } from './component/finished/finished.component';
import { AboutComponent } from './component/about/about.component';  
import { ContactUsComponent } from './component/contact-us/contact-us.component';  
import { LessonBoardComponent } from './component/lesson-board/lesson-board.component';
import { ChatbotComponent } from './component/chatbot/chatbot.component';
import { SelectModeComponent } from './component/select-mode/select-mode.component';
import { SelectModuleComponent } from './component/select-module/select-module.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'select-class', component: SelectClassComponent },
  { path: 'select-subject', component: SelectSubjectComponent }, 
  { path: 'welcome', component: WelcomeComponent }, 
  { path: 'signin', component: SigninComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'landing', component: LandingComponent },
  { path: 'finished', component: FinishedComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactUsComponent }, 
  { path: 'lesson', component: LessonBoardComponent },
  { path: 'chatbot', component: ChatbotComponent },
  { path: 'select-mode', component: SelectModeComponent },
  { path: 'select-module', component: SelectModuleComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];
