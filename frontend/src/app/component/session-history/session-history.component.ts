import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SessionDTO, SessionType } from '../../model/session.model';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-session-history',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './session-history.component.html',
    styleUrls: ['./session-history.component.css']
})
export class SessionHistoryComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private userService = inject(UserService);

    session: SessionDTO | null = null;
    loading = true;
    error = '';
    activeTab: 'summary' | 'quiz' | 'chat' = 'summary';

    ngOnInit() {
        this.route.paramMap.subscribe(async params => {
            const sessionId = params.get('id');
            if (sessionId) {
                try {
                    this.loading = true;
                    this.session = await firstValueFrom(this.userService.getSessionById(sessionId));
                } catch (err) {
                    console.error('Error fetching session:', err);
                    this.error = 'عذراً، لم نتمكن من العثور على تفاصيل الجلسة.';
                } finally {
                    this.loading = false;
                }
            }
        });
    }

    setActiveTab(tab: 'summary' | 'quiz' | 'chat') {
        this.activeTab = tab;
    }

    getScorePercentage(): number {
        if (!this.session || this.session.quizScore === undefined) return 0;
        // Assuming score is out of 10 or based on number of questions if recorded properly.
        // The previous implementation maxed score at 10 in Entity.
        // If invalid or zero, just return a safe value.
        const maxScore = 10; // Or calculate from quiz elements length if available?
        // Let's rely on quizScore field for now.
        return Math.round((this.session.quizScore / maxScore) * 100);
    }

    getGradeLabel(): string {
        const percent = this.getScorePercentage();
        if (percent >= 90) return 'ممتاز';
        if (percent >= 75) return 'جيد جداً';
        if (percent >= 50) return 'جيد';
        return 'يحتاج للتحسين';
    }


    getGradeClass(): string {
        const percent = this.getScorePercentage();
        if (percent >= 90) return 'grade-excellent';
        if (percent >= 70) return 'grade-good';
        if (percent >= 50) return 'grade-average';
        return 'grade-poor';
    }

    // Helper methods to check session type
    isQuizSession(): boolean {
        return this.session?.sessionType === SessionType.QUIZ;
    }

    isQnaSession(): boolean {
        return this.session?.sessionType === SessionType.QNA;
    }

    isSummarySession(): boolean {
        return this.session?.sessionType === SessionType.SUMMARY;
    }

    getSessionTypeLabel(): string {
        if (!this.session?.sessionType) return 'غير محدد';
        switch (this.session.sessionType) {
            case SessionType.QUIZ: return 'اختبار';
            case SessionType.QNA: return 'أسئلة وأجوبة';
            case SessionType.SUMMARY: return 'ملخص';
            default: return 'غير محدد';
        }
    }

    getSessionTypeIcon(): string {
        if (!this.session?.sessionType) return '📋';
        switch (this.session.sessionType) {
            case SessionType.QUIZ: return '📝';
            case SessionType.QNA: return '💬';
            case SessionType.SUMMARY: return '📚';
            default: return '📋';
        }
    }

    // Get summary text from summaryElements array
    getSummaryText(): string {
        if (!this.session) return '';

        // Try summaryElements first (new format)
        if (this.session.summaryElements && this.session.summaryElements.length > 0) {
            return this.session.summaryElements.map(el => el.content).join('\n\n');
        }

        // Fallback to old summary field for backward compatibility
        return this.session.summary || 'مغامرة تعليمية ممتعة!';
    }
}
