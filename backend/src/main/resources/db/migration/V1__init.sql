-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: client (User entity)
CREATE TABLE IF NOT EXISTS client (
    id UUID PRIMARY KEY,
    keycloak_user_id VARCHAR(36) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    firstname VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL,
    level VARCHAR(255) NOT NULL,
    elo INTEGER NOT NULL CHECK (elo >= 0),
    role VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Table: session
CREATE TABLE IF NOT EXISTS session (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    level VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    module VARCHAR(255) NOT NULL,
    lesson VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    quiz_score INTEGER CHECK (quiz_score BETWEEN 0 AND 10),
    summary TEXT,
    session_feedback TEXT,
    lesson_content TEXT,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES client(id) ON DELETE CASCADE
);

-- Collection tables for Session lists
CREATE TABLE IF NOT EXISTS session_summary_points (
    session_id UUID NOT NULL,
    summary_points_of_focus VARCHAR(255),
    idx INTEGER NOT NULL,
    CONSTRAINT fk_summary_session FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session_quiz_points (
    session_id UUID NOT NULL,
    quiz_points_of_focus VARCHAR(255),
    idx INTEGER NOT NULL,
    CONSTRAINT fk_quiz_session FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE
);

-- Table: note
CREATE TABLE IF NOT EXISTS note (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    note_type VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    level VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    module VARCHAR(255) NOT NULL,
    lesson VARCHAR(255) NOT NULL,
    CONSTRAINT fk_note_user FOREIGN KEY (user_id) REFERENCES client(id) ON DELETE CASCADE
);

-- Table: qna_element
CREATE TABLE IF NOT EXISTS qna_element (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    idx INTEGER,
    CONSTRAINT fk_qna_session FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE
);

-- Table: quiz_element
CREATE TABLE IF NOT EXISTS quiz_element (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL,
    quiz_type VARCHAR(255) NOT NULL,
    question VARCHAR(255) NOT NULL,
    answer VARCHAR(255) NOT NULL,
    answered BOOLEAN NOT NULL,
    idx INTEGER,
    CONSTRAINT fk_quiz_element_session FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE
);

-- Collection table for QuizElement options
CREATE TABLE IF NOT EXISTS quiz_element_options (
    quiz_element_id UUID NOT NULL,
    option_value VARCHAR(255) NOT NULL,
    CONSTRAINT fk_quiz_options_element FOREIGN KEY (quiz_element_id) REFERENCES quiz_element(id) ON DELETE CASCADE
);
