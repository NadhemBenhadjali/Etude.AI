-- V5__update_achievement_icons_to_emojis.sql

-- تحويل أسماء الأيقونات الإنجليزية إلى إيموجي

-- جلسات المذاكرة / المدرسة
UPDATE achievement
SET icon = '🎓'
WHERE icon = 'school';

-- الاختبارات / الكويزات
UPDATE achievement
SET icon = '📝'
WHERE icon = 'quiz';

-- القصص / الدروس
UPDATE achievement
SET icon = '📖'
WHERE icon = 'auto_stories';

-- Elo / الترتيب
UPDATE achievement
SET icon = '📈'
WHERE icon = 'trending_up';

-- النجوم / الجوائز
UPDATE achievement
SET icon = '⭐'
WHERE icon = 'star';

-- ميداليات / إنجازات قوية
UPDATE achievement
SET icon = '🏅'
WHERE icon = 'military_tech';

-- إنجازات البداية / الرايات
UPDATE achievement
SET icon = '🚩'
WHERE icon = 'flag';

-- إنجازات الوقت / السرعة
UPDATE achievement
SET icon = '⏱️'
WHERE icon = 'timer';