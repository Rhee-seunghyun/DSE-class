-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('master', 'speaker', 'student');

-- Create profiles table for storing user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    license_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create lectures table for speaker content management
CREATE TABLE public.lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    speaker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    pdf_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whitelist table for email-based access control
CREATE TABLE public.whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    speaker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    student_name TEXT,
    license_number TEXT,
    is_registered BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (lecture_id, email)
);

-- Create lecture_notes table for student notes
CREATE TABLE public.lecture_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (student_id, lecture_id)
);

-- Create security_logs table for capture attempt tracking
CREATE TABLE public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    lecture_id UUID REFERENCES public.lectures(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    lecture_title TEXT,
    user_email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Master can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'master'));

-- User roles policies
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Master can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'master'));

-- Lectures policies
CREATE POLICY "Speakers can manage their own lectures"
ON public.lectures FOR ALL
USING (auth.uid() = speaker_id);

CREATE POLICY "Students can view lectures they have access to"
ON public.lectures FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.whitelist w
    JOIN public.profiles p ON p.email = w.email
    WHERE w.lecture_id = lectures.id
    AND p.user_id = auth.uid()
    AND w.is_registered = true
  )
);

CREATE POLICY "Master can view all lectures"
ON public.lectures FOR SELECT
USING (public.has_role(auth.uid(), 'master'));

-- Whitelist policies
CREATE POLICY "Speakers can manage their own whitelist"
ON public.whitelist FOR ALL
USING (auth.uid() = speaker_id);

CREATE POLICY "Users can view their own whitelist entries"
ON public.whitelist FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.email = whitelist.email
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Master can view all whitelist entries"
ON public.whitelist FOR SELECT
USING (public.has_role(auth.uid(), 'master'));

-- Lecture notes policies
CREATE POLICY "Students can manage their own notes"
ON public.lecture_notes FOR ALL
USING (auth.uid() = student_id);

CREATE POLICY "Speakers can view notes for their lectures"
ON public.lecture_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lectures l
    WHERE l.id = lecture_notes.lecture_id
    AND l.speaker_id = auth.uid()
  )
);

-- Security logs policies
CREATE POLICY "Master can view all security logs"
ON public.security_logs FOR SELECT
USING (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Speakers can view logs for their lectures"
ON public.security_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lectures l
    WHERE l.id = security_logs.lecture_id
    AND l.speaker_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert security logs"
ON public.security_logs FOR INSERT
WITH CHECK (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lectures_updated_at
    BEFORE UPDATE ON public.lectures
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lecture_notes_updated_at
    BEFORE UPDATE ON public.lecture_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup (creates profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for lecture PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('lecture-files', 'lecture-files', false);

-- Storage policies for lecture files
CREATE POLICY "Speakers can upload lecture files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lecture-files'
  AND public.has_role(auth.uid(), 'speaker')
);

CREATE POLICY "Speakers can update their lecture files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lecture-files'
  AND public.has_role(auth.uid(), 'speaker')
);

CREATE POLICY "Speakers can delete their lecture files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lecture-files'
  AND public.has_role(auth.uid(), 'speaker')
);

CREATE POLICY "Authenticated users can view lecture files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lecture-files'
  AND auth.role() = 'authenticated'
);