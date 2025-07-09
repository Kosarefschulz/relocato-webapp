-- WhatsApp Messages Table
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wa_message_id TEXT UNIQUE NOT NULL, -- WhatsApp Message ID
    conversation_id TEXT NOT NULL, -- WhatsApp Conversation ID
    from_number TEXT NOT NULL, -- Sender phone number
    from_name TEXT, -- Sender name if available
    to_number TEXT NOT NULL, -- Recipient phone number
    message_type TEXT NOT NULL, -- text, image, video, audio, document, location, sticker
    text_content TEXT, -- Message text content
    media_url TEXT, -- URL for media files
    media_mime_type TEXT, -- MIME type for media
    media_sha256 TEXT, -- SHA256 hash for media verification
    media_id TEXT, -- WhatsApp media ID
    caption TEXT, -- Caption for media messages
    location_latitude DECIMAL(10, 8), -- For location messages
    location_longitude DECIMAL(11, 8), -- For location messages
    location_name TEXT, -- Location name
    location_address TEXT, -- Location address
    status TEXT NOT NULL DEFAULT 'received', -- sent, delivered, read, failed, received
    direction TEXT NOT NULL, -- inbound, outbound
    timestamp TIMESTAMPTZ NOT NULL,
    context_message_id TEXT, -- For replies/quoted messages
    is_forwarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb -- For additional WhatsApp data
);

-- WhatsApp Customer Links Table
CREATE TABLE IF NOT EXISTS public.whatsapp_customer_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.whatsapp_messages(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    linked_by UUID REFERENCES public.users(id),
    UNIQUE(message_id, customer_id)
);

-- WhatsApp Conversations Table (for grouping messages)
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id TEXT UNIQUE NOT NULL, -- WhatsApp Conversation ID
    phone_number TEXT NOT NULL, -- Customer phone number
    customer_id UUID REFERENCES public.customers(id),
    customer_name TEXT,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    unread_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, archived, resolved
    assigned_to UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- WhatsApp Templates Table
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT UNIQUE NOT NULL,
    template_id TEXT NOT NULL, -- 360dialog template ID
    language TEXT NOT NULL DEFAULT 'de',
    category TEXT NOT NULL, -- MARKETING, UTILITY, AUTHENTICATION
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    header_type TEXT, -- text, image, video, document
    header_content TEXT,
    body_content TEXT NOT NULL,
    footer_content TEXT,
    buttons JSONB DEFAULT '[]'::jsonb,
    parameters JSONB DEFAULT '[]'::jsonb, -- Parameter definitions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- WhatsApp Media Table (for storing media references)
CREATE TABLE IF NOT EXISTS public.whatsapp_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id TEXT UNIQUE NOT NULL, -- WhatsApp media ID
    mime_type TEXT NOT NULL,
    sha256 TEXT NOT NULL,
    file_size INTEGER,
    storage_path TEXT, -- Path in Supabase Storage
    download_url TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id ON public.whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number ON public.whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON public.whatsapp_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON public.whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone_number ON public.whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_customer_id ON public.whatsapp_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_customer_links_customer_id ON public.whatsapp_customer_links(customer_id);

-- RLS Policies
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_customer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_media ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can view all WhatsApp messages" ON public.whatsapp_messages
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert WhatsApp messages" ON public.whatsapp_messages
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update WhatsApp messages" ON public.whatsapp_messages
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can view all WhatsApp conversations" ON public.whatsapp_conversations
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can manage WhatsApp customer links" ON public.whatsapp_customer_links
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view WhatsApp templates" ON public.whatsapp_templates
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage WhatsApp media" ON public.whatsapp_media
    FOR ALL TO authenticated USING (true);

-- Function to update conversation on new message
CREATE OR REPLACE FUNCTION update_whatsapp_conversation()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or create conversation
    INSERT INTO public.whatsapp_conversations (
        conversation_id,
        phone_number,
        last_message_at,
        last_message_preview,
        unread_count
    )
    VALUES (
        NEW.conversation_id,
        CASE 
            WHEN NEW.direction = 'inbound' THEN NEW.from_number
            ELSE NEW.to_number
        END,
        NEW.timestamp,
        COALESCE(NEW.text_content, NEW.caption, '[Media]'),
        CASE WHEN NEW.direction = 'inbound' THEN 1 ELSE 0 END
    )
    ON CONFLICT (conversation_id) DO UPDATE SET
        last_message_at = NEW.timestamp,
        last_message_preview = COALESCE(NEW.text_content, NEW.caption, '[Media]'),
        unread_count = CASE 
            WHEN NEW.direction = 'inbound' THEN 
                public.whatsapp_conversations.unread_count + 1
            ELSE 
                public.whatsapp_conversations.unread_count
        END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating conversations
CREATE TRIGGER update_conversation_on_message
    AFTER INSERT ON public.whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_conversation();