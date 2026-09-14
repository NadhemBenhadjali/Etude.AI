import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SessionDTO } from '../../model/session.model';
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
    displayDate: string = '';


    ngOnInit() {
        this.route.paramMap.subscribe(async params => {
            const sessionId = params.get('id');
            if (sessionId) {
                try {
                    this.loading = true;
                    this.session = await firstValueFrom(this.userService.getSessionById(sessionId));
                    this.displayDate = this.computeDisplayDate();
                } catch (err) {
                    console.error('Error fetching session:', err);
                    this.error = 'عذراً، لم نتمكن من العثور على تفاصيل الجلسة.';
                } finally {
                    this.loading = false;
                }
            }
        });
    }

    private getTypeUpperCase(): string {
        const type = this.session?.sessionType;
        if (!type) return '';
        // Handle both string and enum cases
        return String(type).toUpperCase().trim();
    }

    getScorePercentage(): number {
        if (!this.session || this.session.quizScore === undefined) return 0;
        const maxScore = 10;
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

    getGradeEmoji(): string {
        const percent = this.getScorePercentage();
        if (percent >= 90) return '🌟';
        if (percent >= 70) return '✨';
        if (percent >= 50) return '👍';
        return '💪';
    }

    isQuizSession(): boolean {
        return this.getTypeUpperCase() === 'QUIZ';
    }

    isQnaSession(): boolean {
        return this.getTypeUpperCase() === 'QNA';
    }

    isSummarySession(): boolean {
        return this.getTypeUpperCase() === 'SUMMARY';
    }

    hasKnownType(): boolean {
        return this.isQuizSession() || this.isQnaSession() || this.isSummarySession();
    }

    hasContent(): boolean {
        if (!this.session) return false;
        if (this.isQuizSession()) return !!(this.session.quizElements?.length || this.session.quizScore !== undefined);
        if (this.isQnaSession()) return !!this.session.qnaElements?.length;
        if (this.isSummarySession()) return !!(this.session.summaryElements?.length || this.session.summary);
        return false;
    }

    getSessionTypeLabel(): string {
        const type = this.getTypeUpperCase();
        switch (type) {
            case 'QUIZ': return 'اختبار';
            case 'QNA': return 'أسئلة وأجوبة';
            case 'SUMMARY': return 'ملخص';
            default: return 'جلسة تعليمية';
        }
    }

    getSessionTypeIcon(): string {
        const type = this.getTypeUpperCase();
        switch (type) {
            case 'QUIZ': return 'quiz.png';
            case 'QNA': return 'chat.png';
            case 'SUMMARY': return 'scroll.png';
            default: return 'note.png';
        }
    }

    getPageTitle(): string {
        const type = this.getTypeUpperCase();
        switch (type) {
            case 'QUIZ': return 'نتائج الاختبار';
            case 'QNA': return 'سجل المحادثة';
            case 'SUMMARY': return 'ملخص الرحلة';
            default: return 'سجل المغامرات';
        }
    }

    getPageIcon(): string {
        const type = this.getTypeUpperCase();
        switch (type) {
            case 'QUIZ': return 'trophy.png';
            case 'QNA': return 'chat.png';
            case 'SUMMARY': return 'scroll.png';
            default: return 'trophy.png';
        }
    }

    getTypeThemeClass(): string {
        const type = this.getTypeUpperCase();
        switch (type) {
            case 'QUIZ': return 'theme-quiz';
            case 'QNA': return 'theme-qna';
            case 'SUMMARY': return 'theme-summary';
            default: return 'theme-default';
        }
    }

    getSummaryText(): string {
        if (!this.session) return '';
        if (this.session.summaryElements && this.session.summaryElements.length > 0) {
            return this.session.summaryElements.map(el => el.content).join('\n\n');
        }
        return this.session.summary || 'مغامرة تعليمية ممتعة!';
    }

    getCorrectCount(): number {
        if (!this.session?.quizElements) return 0;
        return this.session.quizElements.filter(q => q.answered).length;
    }

    private computeDisplayDate(): string {
        const raw = this.session?.createdAt || this.session?.startedAt || null;
        if (!raw) return '';
        try {
            const dateStr = String(raw);
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) {
                console.warn('[SessionHistory] Invalid date:', raw);
                return '';
            }
            // Format: YYYY-MM-DD
            return d.toLocaleDateString('ar-TN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            console.warn('[SessionHistory] Error parsing date:', raw, e);
            return '';
        }
    }

    getScoreStars(): number[] {
        const score = this.session?.quizScore ?? 0;
        const starCount = Math.round(score / 2);
        return Array(5).fill(0).map((_, i) => i < starCount ? 1 : 0);
    }
}
