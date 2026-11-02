-- +goose Up
CREATE TABLE entities (
    id          uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text             NOT NULL,
    type        text             NOT NULL CHECK (type IN ('vehicle', 'iot_device', 'facility', 'other')),
    status      text             NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance', 'offline')),
    latitude    double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude   double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    description text             NOT NULL DEFAULT '',
    attributes  jsonb            NOT NULL DEFAULT '{}'::jsonb,
    created_at  timestamptz      NOT NULL DEFAULT now(),
    updated_at  timestamptz      NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE entities;
