-- 회원가입 시 whitelist에 승인된 사용자면 자동으로 student 역할 부여
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- 프로필 생성
    INSERT INTO public.profiles (user_id, email, full_name, license_number)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'license_number'
    );
    
    -- whitelist에 승인된(is_registered = true) 이메일인 경우 student 역할 부여
    IF EXISTS (
        SELECT 1 FROM public.whitelist 
        WHERE email = NEW.email AND is_registered = true
    ) THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'student')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;