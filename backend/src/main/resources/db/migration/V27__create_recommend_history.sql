CREATE TABLE recommend_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    farm_id BIGINT NOT NULL,
    farm_name VARCHAR(255),
    farm_address VARCHAR(255),
    farm_area DOUBLE PRECISION,
    soil_ph DOUBLE PRECISION,
    organic_matter DOUBLE PRECISION,
    soil_type VARCHAR(100),
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recommend_history_item (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    history_id BIGINT NOT NULL REFERENCES recommend_history(id) ON DELETE CASCADE,
    crop_id BIGINT,
    crop_name VARCHAR(100),
    category VARCHAR(50),
    "rank" INT,
    score INT,
    soil_fitness VARCHAR(50),
    soil_fitness_percent INT,
    price_forecast_percent INT,
    supply_stability_percent INT,
    supply_status VARCHAR(50),
    expected_revenue_per_kg INT,
    expected_yield INT,
    ai_reason TEXT,
    difficulty INT,
    growth_days INT,
    optimal_temp VARCHAR(100),
    sowing_period VARCHAR(100),
    harvest_period VARCHAR(100)
);
