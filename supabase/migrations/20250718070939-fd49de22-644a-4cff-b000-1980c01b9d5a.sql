-- Create employees table (extends user profiles)
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL UNIQUE,
  face_encoding BYTEA,
  department TEXT NOT NULL,
  position TEXT,
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visitors table
CREATE TABLE public.visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  face_encoding BYTEA,
  purpose_of_visit TEXT NOT NULL,
  host_employee_id UUID REFERENCES public.employees(id),
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  expected_checkout TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'checked_in', 'checked_out', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assets table for tracking equipment
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id TEXT NOT NULL UNIQUE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('laptop', 'desktop', 'tablet', 'phone', 'monitor', 'keyboard', 'mouse', 'other')),
  brand TEXT,
  model TEXT,
  serial_number TEXT NOT NULL UNIQUE,
  purchase_date DATE,
  warranty_expiry DATE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance', 'retired')),
  current_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee_assets junction table
CREATE TABLE public.employee_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  assigned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  returned_date TIMESTAMP WITH TIME ZONE,
  assigned_by UUID REFERENCES auth.users(id),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, asset_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Create communications table
CREATE TABLE public.communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_id UUID REFERENCES auth.users(id),
  recipient_type TEXT DEFAULT 'individual' CHECK (recipient_type IN ('individual', 'department', 'all_staff', 'all_visitors')),
  recipient_department TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  communication_type TEXT DEFAULT 'message' CHECK (communication_type IN ('message', 'announcement', 'alert', 'notification')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees
CREATE POLICY "Employees can view their own record" ON public.employees
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all employees" ON public.employees
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can manage employees" ON public.employees
FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for visitors
CREATE POLICY "Staff can view visitors" ON public.visitors
FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'security_officer', 'staff']));

CREATE POLICY "Admins and security can manage visitors" ON public.visitors
FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'security_officer']));

-- RLS Policies for assets
CREATE POLICY "Staff can view assets" ON public.assets
FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'security_officer', 'staff']));

CREATE POLICY "Admins can manage assets" ON public.assets
FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for employee_assets
CREATE POLICY "Employees can view their assigned assets" ON public.employee_assets
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE employees.id = employee_assets.employee_id 
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "Staff can view all asset assignments" ON public.employee_assets
FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'security_officer', 'staff']));

CREATE POLICY "Admins can manage asset assignments" ON public.employee_assets
FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for communications
CREATE POLICY "Users can view their sent communications" ON public.communications
FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Users can view communications addressed to them" ON public.communications
FOR SELECT USING (
  auth.uid() = recipient_id OR 
  recipient_type = 'all_staff' OR
  (recipient_type = 'department' AND recipient_department = (
    SELECT department FROM public.profiles WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Staff can send communications" ON public.communications
FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update read status of their communications" ON public.communications
FOR UPDATE USING (
  auth.uid() = recipient_id OR 
  recipient_type = 'all_staff' OR
  (recipient_type = 'department' AND recipient_department = (
    SELECT department FROM public.profiles WHERE user_id = auth.uid()
  ))
);

-- Create triggers for updated_at
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visitors_updated_at
BEFORE UPDATE ON public.visitors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_assets_updated_at
BEFORE UPDATE ON public.employee_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communications_updated_at
BEFORE UPDATE ON public.communications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create functions for generating IDs
CREATE OR REPLACE FUNCTION public.generate_employee_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_id TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    new_id := 'EMP' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.employees WHERE employee_id = new_id) INTO exists_check;
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_visitor_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_id TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    new_id := 'VIS' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.visitors WHERE visitor_id = new_id) INTO exists_check;
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_asset_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_id TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    new_id := 'AST' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.assets WHERE asset_id = new_id) INTO exists_check;
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN new_id;
END;
$$;

-- Add indexes for better performance
CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employees_employee_id ON public.employees(employee_id);
CREATE INDEX idx_employees_department ON public.employees(department);
CREATE INDEX idx_visitors_visitor_id ON public.visitors(visitor_id);
CREATE INDEX idx_visitors_status ON public.visitors(status);
CREATE INDEX idx_visitors_check_in_time ON public.visitors(check_in_time);
CREATE INDEX idx_assets_asset_id ON public.assets(asset_id);
CREATE INDEX idx_assets_serial_number ON public.assets(serial_number);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_employee_assets_employee_id ON public.employee_assets(employee_id);
CREATE INDEX idx_employee_assets_asset_id ON public.employee_assets(asset_id);
CREATE INDEX idx_communications_sender_id ON public.communications(sender_id);
CREATE INDEX idx_communications_recipient_id ON public.communications(recipient_id);
CREATE INDEX idx_communications_created_at ON public.communications(created_at);

-- Enable realtime for all new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.communications;