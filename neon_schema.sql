-- ==============================================================================
-- GJS Railway Board Studio · Neon PostgreSQL Schema
-- ==============================================================================
-- How to run this in Neon:
-- 1. Open your Neon Console: https://console.neon.tech
-- 2. Select your Project -> Click "SQL Editor" on the left menu
-- 3. Paste this script and click "Run" (or Ctrl+Enter)

-- 1. Create Templates Table
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'LED Texture Sheet',
    description TEXT,
    aspect_ratio TEXT DEFAULT '1:1',
    base_width INTEGER NOT NULL DEFAULT 1024,
    base_height INTEGER NOT NULL DEFAULT 1024,
    background_color TEXT DEFAULT '#0c0f12',
    background_type TEXT DEFAULT 'transparent',
    background_image_url TEXT,
    background_secondary_color TEXT,
    border_color TEXT DEFAULT 'transparent',
    border_width INTEGER DEFAULT 0,
    border_radius INTEGER DEFAULT 0,
    show_bolts BOOLEAN DEFAULT false,
    inner_border BOOLEAN DEFAULT false,
    inner_border_color TEXT,
    inner_border_padding INTEGER DEFAULT 6,
    is_texture_sheet BOOLEAN DEFAULT true,
    texture_resolution INTEGER DEFAULT 1024,
    published BOOLEAN DEFAULT true,
    is_paid BOOLEAN DEFAULT false,
    price NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    fields JSONB DEFAULT '[]'::jsonb,
    fixed_graphics JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create User Purchases Table (Sync Template Unlocks Across All Devices)
CREATE TABLE IF NOT EXISTS user_purchases (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    order_id TEXT,
    reference_id TEXT,
    amount NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    payment_mode TEXT,
    status TEXT DEFAULT 'SUCCESS',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_template_id ON user_purchases(template_id);

-- 3. Create User Saved Boards Table
CREATE TABLE IF NOT EXISTS user_saved_boards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    title TEXT NOT NULL,
    field_values JSONB DEFAULT '{}'::jsonb,
    custom_background_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_saved_boards_user_id ON user_saved_boards(user_id);

-- 4. Create Cashfree Transaction Audit Logs Table
CREATE TABLE IF NOT EXISTS cashfree_logs (
    id BIGSERIAL PRIMARY KEY,
    order_id TEXT NOT NULL,
    reference_id TEXT,
    customer_id TEXT,
    customer_email TEXT,
    amount NUMERIC,
    currency TEXT DEFAULT 'INR',
    status TEXT,
    payment_mode TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cashfree_logs_order_id ON cashfree_logs(order_id);

-- ==============================================================================
-- 5. Seed Initial Railway Templates (Amrit Bharat & GJS Productions)
-- ==============================================================================
INSERT INTO templates (
    id, name, category, description, aspect_ratio, base_width, base_height,
    background_color, background_type, background_image_url, border_color,
    border_width, border_radius, show_bolts, is_texture_sheet, texture_resolution,
    published, is_paid, price, currency, fields, fixed_graphics
) VALUES 
(
    'tpl-amrit-bharat-1024',
    'Amrit Bharat Express LED Texture Sheet (1024×1024)',
    'LED Texture Sheet',
    'Official Indian Railways Amrit Bharat Push-Pull Express LED Destination UV Texture Sheet.',
    '1:1',
    1024,
    1024,
    '#0c0f12',
    'transparent',
    './textures/amrit_bharat_led_sheet.png',
    'transparent',
    0,
    0,
    false,
    true,
    1024,
    true,
    false,
    0,
    'INR',
    '[
        {"id": "field_train_no", "label": "Train Number Slot", "type": "text", "defaultValue": "12627 / 12628", "placeholder": "TRAIN NO.", "x": 50, "y": 20, "width": 70, "height": 10, "fontFamily": "\x27VT323\x27, monospace", "fontSize": 58, "fontWeight": 700, "color": "#00e5ff", "align": "center", "glow": true, "glowColor": "#00b4d8", "allowUserEdit": true},
        {"id": "field_origin", "label": "Origin Station (Bilingual)", "type": "text", "defaultValue": "नई दिल्ली · NEW DELHI", "placeholder": "ORIGIN", "x": 50, "y": 38, "width": 80, "height": 12, "fontFamily": "\x27VT323\x27, monospace", "fontSize": 52, "fontWeight": 700, "color": "#ffb703", "align": "center", "glow": true, "glowColor": "#fb8500", "allowUserEdit": true},
        {"id": "field_dest", "label": "Destination Station (Bilingual)", "type": "text", "defaultValue": "केएसआर बेंगलुरु · KSR BENGALURU", "placeholder": "DESTINATION", "x": 50, "y": 55, "width": 80, "height": 12, "fontFamily": "\x27VT323\x27, monospace", "fontSize": 50, "fontWeight": 700, "color": "#ffb703", "align": "center", "glow": true, "glowColor": "#fb8500", "allowUserEdit": true},
        {"id": "field_via", "label": "Via Stations / Route", "type": "text", "defaultValue": "VIA: ITARSI · NAGPUR · KAZIPET", "placeholder": "VIA ROUTE", "x": 50, "y": 70, "width": 85, "height": 8, "fontFamily": "\x27Share Tech Mono\x27, monospace", "fontSize": 34, "fontWeight": 600, "color": "#90e0ef", "align": "center", "glow": true, "glowColor": "#0077b6", "allowUserEdit": true}
    ]'::jsonb,
    '[]'::jsonb
),
(
    'tpl-gjs-led-1024',
    'GJS Productions LED Texture Sheet (1024×1024)',
    'LED Texture Sheet',
    'Official high-density orange LED destination texture sheet for train simulators.',
    '1:1',
    1024,
    1024,
    '#0b192c',
    'transparent',
    './textures/gjs_productions_led_sheet.png',
    'transparent',
    0,
    0,
    false,
    true,
    1024,
    true,
    true,
    99,
    'INR',
    '[
        {"id": "field_train_no", "label": "Train Number Slot", "type": "text", "defaultValue": "22435 / 22436", "placeholder": "TRAIN NUMBER", "x": 50, "y": 25, "width": 75, "height": 12, "fontFamily": "\x27VT323\x27, monospace", "fontSize": 62, "fontWeight": 700, "color": "#ff9e00", "align": "center", "glow": true, "glowColor": "#ff6000", "allowUserEdit": true},
        {"id": "field_route_name", "label": "Express Route Name", "type": "text", "defaultValue": "VANDE BHARAT EXPRESS", "placeholder": "ROUTE NAME", "x": 50, "y": 48, "width": 85, "height": 14, "fontFamily": "\x27VT323\x27, monospace", "fontSize": 58, "fontWeight": 700, "color": "#00f0ff", "align": "center", "glow": true, "glowColor": "#00a2ff", "allowUserEdit": true},
        {"id": "field_coach_badge", "label": "Coach Class Code", "type": "text", "defaultValue": "EC - EXECUTIVE CLASS", "placeholder": "CLASS CODE", "x": 50, "y": 72, "width": 70, "height": 10, "fontFamily": "\x27Share Tech Mono\x27, monospace", "fontSize": 38, "fontWeight": 700, "color": "#00ff88", "align": "center", "glow": true, "glowColor": "#00b050", "allowUserEdit": true}
    ]'::jsonb,
    '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
