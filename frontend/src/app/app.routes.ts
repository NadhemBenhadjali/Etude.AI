import { Routes } from '@angular/router';
import { HomeComponent } from './component/home/home.component';
import { SigninComponent } from './component/signin/signin.component';
import { SignupComponent } from './component/signup/signup.component';
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
import { ChatbotQuizComponent } from './component/chatbot-quiz/chatbot-quiz.component';
import { ProfileComponent } from './component/profile/profile.component';
import { kcAuthGuard } from './services/kc-auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  // Protected screens:
  { path: 'select-class',  component: SelectClassComponent,  canActivate: [kcAuthGuard] },
  { path: 'select-subject', component: SelectSubjectComponent, canActivate: [kcAuthGuard] },
  { path: 'select-mode',   component: SelectModeComponent,   canActivate: [kcAuthGuard] },
  { path: 'select-module', component: SelectModuleComponent, canActivate: [kcAuthGuard] },
  { path: 'lesson',        component: LessonBoardComponent,  canActivate: [kcAuthGuard] },
  { path: 'chatbot',       component: ChatbotComponent,      canActivate: [kcAuthGuard] },
  { path: 'chatbot-quiz',  component: ChatbotQuizComponent,  canActivate: [kcAuthGuard] },
  { path: 'profile',       component: ProfileComponent,      canActivate: [kcAuthGuard] },

  // Public:
  { path: 'welcome', component: WelcomeComponent },
  { path: 'signin',  component: SigninComponent },
  { path: 'signup',  component: SignupComponent },
  { path: 'finished', component: FinishedComponent },
  { path: 'about',   component: AboutComponent },
  { path: 'contact', component: ContactUsComponent },

  { path: '', redirectTo: 'home', pathMatch: 'full' }
];
