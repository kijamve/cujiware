-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    cta_text VARCHAR(100) NOT NULL,
    cta_link VARCHAR(255) NOT NULL,
    is_highlighted BOOLEAN DEFAULT false,
    savings_text VARCHAR(100),
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create plan_features table for the many-to-many relationship
CREATE TABLE IF NOT EXISTS plan_features (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO plans (name, price, duration, description, cta_text, cta_link, is_highlighted, savings_text, is_visible) VALUES
    ('Mensual', 12.00, 'mes', 'Perfecto para probar nuestros plugins o proyectos cortos.', 'Seleccionar Plan', '#', false, null, true),
    ('Semestral', 60.00, '6 meses', 'Nuestro plan más popular para negocios en crecimiento.', 'Seleccionar Plan', '#', true, '17% DE DESCUENTO', true),
    ('Anual', 115.00, 'año', 'Mejor valor para dueños de tiendas serios.', 'Seleccionar Plan', '#', false, '20% DE DESCUENTO', true);

-- Insert features for each plan
INSERT INTO plan_features (plan_id, feature) VALUES
    (1, 'Todos los plugins'),
    (1, 'Actualizaciones'),
    (1, 'Soporte técnico'),
    (2, 'Todos los plugins'),
    (2, 'Actualizaciones'),
    (2, 'Soporte técnico'),
    (3, 'Todos los plugins'),
    (3, 'Actualizaciones'),
    (3, 'Soporte técnico'); 