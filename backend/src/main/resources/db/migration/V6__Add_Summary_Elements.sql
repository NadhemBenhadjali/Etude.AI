-- V6: Add Summary Elements table
CREATE TABLE summary_element (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    idx INTEGER
);

CREATE INDEX idx_summary_element_session_id ON summary_element(session_id);

