DELETE FROM achievement
WHERE (name, criteria_type, criteria_value) IN (
                                                ('First Step',       'SESSION_COUNT', 1),
                                                ('Quiz Master',      'QUIZ_COUNT', 5),
                                                ('Dedicated Scholar','SESSION_COUNT', 10),
                                                ('Elo Climber',      'SCORE_REACHED', 100)
    );
