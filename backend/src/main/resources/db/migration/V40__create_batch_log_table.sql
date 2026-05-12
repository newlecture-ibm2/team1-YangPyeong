-- V40__create_batch_log_table.sql
CREATE TABLE IF NOT EXISTS batch_logs (
    id BIGSERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_processed INT DEFAULT 0,
    total_failed INT DEFAULT 0,
    messages TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_batch_logs_job_name ON batch_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_batch_logs_created_at ON batch_logs(created_at DESC);
