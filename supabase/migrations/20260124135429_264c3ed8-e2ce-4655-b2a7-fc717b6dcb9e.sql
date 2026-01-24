-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analyses table for storing user analyses
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  input_type TEXT NOT NULL CHECK (input_type IN ('text', 'pdf')),
  original_text TEXT NOT NULL,
  body_text TEXT,
  references_text TEXT,
  reference_detection_status TEXT NOT NULL DEFAULT 'pending' CHECK (reference_detection_status IN ('pending', 'success', 'failed')),
  overall_similarity_score DECIMAL(5,2),
  uniqueness_level TEXT CHECK (uniqueness_level IN ('high', 'medium', 'low')),
  research_overview JSONB,
  guidance_suggestions JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create similarity_matches table for individual paper matches
CREATE TABLE public.similarity_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  paper_title TEXT NOT NULL,
  paper_source TEXT NOT NULL,
  paper_url TEXT,
  matched_text_user TEXT NOT NULL,
  matched_text_paper TEXT NOT NULL,
  similarity_percentage DECIMAL(5,2) NOT NULL,
  is_referenced BOOLEAN NOT NULL DEFAULT false,
  section_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.similarity_matches ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Analyses policies
CREATE POLICY "Users can view their own analyses" 
ON public.analyses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analyses" 
ON public.analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" 
ON public.analyses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses" 
ON public.analyses FOR DELETE USING (auth.uid() = user_id);

-- Similarity matches policies
CREATE POLICY "Users can view matches for their analyses" 
ON public.similarity_matches FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.analyses 
  WHERE analyses.id = similarity_matches.analysis_id 
  AND analyses.user_id = auth.uid()
));

CREATE POLICY "Users can insert matches for their analyses" 
ON public.similarity_matches FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.analyses 
  WHERE analyses.id = similarity_matches.analysis_id 
  AND analyses.user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at
BEFORE UPDATE ON public.analyses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on auth.users for auto-creating profile
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();