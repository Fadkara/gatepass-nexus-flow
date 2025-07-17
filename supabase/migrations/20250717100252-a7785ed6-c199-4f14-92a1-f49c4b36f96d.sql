-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'security_officer', 'staff');

-- Create gatepass status enum
CREATE TYPE public.gatepass_status AS ENUM ('pending', 'approved', 'rejected', 'issued', 'exited');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gatepasses table
CREATE TABLE public.gatepasses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gatepass_id TEXT NOT NULL UNIQUE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  department TEXT NOT NULL,
  reason TEXT NOT NULL,
  items_carried TEXT,
  exit_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status gatepass_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  exited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gatepasses ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE profiles.user_id = $1;
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can create profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.get_user_role(auth.uid()) = 'admin');

-- Gatepasses policies
CREATE POLICY "Staff can create their own gatepasses" 
ON public.gatepasses 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Staff can view their own gatepasses" 
ON public.gatepasses 
FOR SELECT 
USING (auth.uid() = requester_id);

CREATE POLICY "Security officers and admins can view all gatepasses" 
ON public.gatepasses 
FOR SELECT 
USING (public.get_user_role(auth.uid()) IN ('security_officer', 'admin'));

CREATE POLICY "Security officers and admins can update gatepasses" 
ON public.gatepasses 
FOR UPDATE 
USING (public.get_user_role(auth.uid()) IN ('security_officer', 'admin'));

-- Function to generate unique gatepass ID
CREATE OR REPLACE FUNCTION public.generate_gatepass_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_id TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    new_id := 'GP' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.gatepasses WHERE gatepass_id = new_id) INTO exists_check;
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN new_id;
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gatepasses_updated_at
BEFORE UPDATE ON public.gatepasses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, department, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'department', 'General'),
    'staff'::app_role
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable realtime for gatepasses
ALTER TABLE public.gatepasses REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gatepasses;