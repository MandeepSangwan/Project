-- FixFleet MVP — Initial Schema
-- Run this in your Supabase SQL Editor

-- profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'technician', 'admin')),
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- service_categories
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_category TEXT,
  icon_name TEXT,
  sort_order INT DEFAULT 0
);

-- technician_profiles
CREATE TABLE technician_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  experience_years INT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected')),
  is_available BOOLEAN DEFAULT FALSE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  service_radius_km INT DEFAULT 25,
  working_hours_start TIME,
  working_hours_end TIME,
  is_emergency_available BOOLEAN DEFAULT FALSE,
  base_visit_charge DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  emergency_surcharge_pct INT DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_jobs INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- technician_skills
CREATE TABLE technician_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES technician_profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL
);

-- technician_categories
CREATE TABLE technician_categories (
  technician_id UUID REFERENCES technician_profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (technician_id, category_id)
);

-- technician_documents
CREATE TABLE technician_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES technician_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- service_requests
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id),
  category_id UUID REFERENCES service_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  urgency TEXT NOT NULL CHECK (urgency IN ('emergency','same_day','scheduled')),
  scheduled_date DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','matched','accepted','in_progress','completed','cancelled')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- request_media
CREATE TABLE request_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES service_requests(id),
  technician_id UUID REFERENCES technician_profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','en_route','arrived','in_progress','completed','cancelled')),
  estimated_cost DECIMAL(10,2),
  final_cost DECIMAL(10,2),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE REFERENCES bookings(id),
  reviewer_id UUID REFERENCES profiles(id),
  reviewee_id UUID REFERENCES profiles(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users can read all, update own
CREATE POLICY "Anyone can read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Service categories: readable by all, writable by admins
CREATE POLICY "Anyone can read categories" ON service_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON service_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Technician profiles: readable by all, updatable by owner or admin
CREATE POLICY "Anyone can read tech profiles" ON technician_profiles FOR SELECT USING (true);
CREATE POLICY "Technician can update own" ON technician_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Technician can insert own" ON technician_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin can update tech profiles" ON technician_profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Skills: readable by all, writable by owner
CREATE POLICY "Anyone can read skills" ON technician_skills FOR SELECT USING (true);
CREATE POLICY "Technician can manage own skills" ON technician_skills FOR ALL USING (
  EXISTS (SELECT 1 FROM technician_profiles WHERE id = technician_id AND user_id = auth.uid())
);

-- Documents: readable by owner + admin, writable by owner
CREATE POLICY "Owner and admin can read docs" ON technician_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM technician_profiles WHERE id = technician_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Technician can upload docs" ON technician_documents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM technician_profiles WHERE id = technician_id AND user_id = auth.uid())
);

-- Service requests: customers see own, technicians see open, admins see all
CREATE POLICY "Customers see own requests" ON service_requests FOR SELECT USING (
  customer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('technician', 'admin'))
);
CREATE POLICY "Customers can create requests" ON service_requests FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Update own or admin" ON service_requests FOR UPDATE USING (
  customer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('technician', 'admin'))
);

-- Bookings: involved parties + admins
CREATE POLICY "Read bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Create bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Update bookings" ON bookings FOR UPDATE USING (true);

-- Reviews: readable by all, writable by reviewer
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Reviewer can create" ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- Request media
CREATE POLICY "Read media" ON request_media FOR SELECT USING (true);
CREATE POLICY "Upload media" ON request_media FOR INSERT WITH CHECK (true);

-- Technician categories
CREATE POLICY "Read tech categories" ON technician_categories FOR SELECT USING (true);
CREATE POLICY "Manage tech categories" ON technician_categories FOR ALL USING (true);

-- Seed categories
INSERT INTO service_categories (name, parent_category, icon_name, sort_order) VALUES
  ('Industrial Electrician', 'Industrial Machinery', '⚡', 0),
  ('Plumber', 'General', '🔧', 1),
  ('HVAC Technician', 'General', '❄️', 2),
  ('CNC Technician', 'Industrial Machinery', '⚙️', 3),
  ('Welder', 'Industrial Machinery', '🔥', 4),
  ('Boiler Technician', 'Industrial Machinery', '🏭', 5),
  ('Appliance Repair', 'General', '🔌', 6),
  ('IT / OT Support', 'General', '💻', 7),
  ('General Electrician', 'General', '💡', 8),
  ('Motor Rewinding', 'Industrial Machinery', '🔄', 9);
