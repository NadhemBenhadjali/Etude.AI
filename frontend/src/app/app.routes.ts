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
import { ChatbotQuizComponent } from './component/chatbot-quiz/chatbot-quiz.component';
import { ProfileComponent } from './component/profile/profile.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { UserManagementComponent } from './component/user-management/user-management.component';
import { AuthGuard } from './guards/auth.guard';


export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'select-class', component: SelectClassComponent, canActivate: [AuthGuard] },
  { path: 'select-subject', component: SelectSubjectComponent, canActivate: [AuthGuard] },
  { path: 'welcome', component: WelcomeComponent },
  { path: 'signin', component: SigninComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'landing', component: LandingComponent },
  { path: 'finished', component: FinishedComponent, canActivate: [AuthGuard] },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactUsComponent },
  { path: 'lesson', component: LessonBoardComponent, canActivate: [AuthGuard] },
  { path: 'chatbot', component: ChatbotComponent, canActivate: [AuthGuard] },
  { path: 'select-mode', component: SelectModeComponent, canActivate: [AuthGuard] },
  { path: 'select-module', component: SelectModuleComponent, canActivate: [AuthGuard] },
  { path: 'chatbot-quiz', component: ChatbotQuizComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'user-management', component: UserManagementComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];
