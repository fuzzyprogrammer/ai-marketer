--
-- PostgreSQL database dump
--

\restrict w8OT3G6YLRvyuzuDWdUzobhlGCZTCufDfOBXfbzX5MCWHzxPTiMjhnVwaTKPfdS

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: ai_marketer
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO ai_marketer;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analytics; Type: TABLE; Schema: public; Owner: ai_marketer
--

CREATE TABLE public.analytics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    brand_id uuid,
    content_id character varying(255),
    channel character varying(50),
    metric_type character varying(50),
    metric_value numeric(15,4),
    event_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    test_variant character varying(10),
    conversion_value numeric(15,2) DEFAULT 0,
    conversion_type character varying(50) DEFAULT 'generic'::character varying,
    click_id uuid
);


ALTER TABLE public.analytics OWNER TO ai_marketer;

--
-- Name: brands; Type: TABLE; Schema: public; Owner: ai_marketer
--

CREATE TABLE public.brands (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    short_description text,
    long_description text,
    categories jsonb DEFAULT '[]'::jsonb,
    tone character varying(100),
    audience jsonb DEFAULT '[]'::jsonb,
    website_url text,
    logo_url text,
    key_products jsonb DEFAULT '[]'::jsonb,
    canonical_pages jsonb DEFAULT '[]'::jsonb,
    contact_email character varying(255),
    extracted_keywords jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.brands OWNER TO ai_marketer;

--
-- Name: content_drafts; Type: TABLE; Schema: public; Owner: ai_marketer
--

CREATE TABLE public.content_drafts (
    id character varying(255) NOT NULL,
    brand_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    content text NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying,
    metadata jsonb DEFAULT '{}'::jsonb,
    test_variant character varying(10) DEFAULT NULL::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.content_drafts OWNER TO ai_marketer;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: ai_marketer
--

CREATE TABLE public.jobs (
    id character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    brand_id uuid,
    data jsonb DEFAULT '{}'::jsonb,
    result jsonb,
    error text,
    retries integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.jobs OWNER TO ai_marketer;

--
-- Name: scheduled_posts; Type: TABLE; Schema: public; Owner: ai_marketer
--

CREATE TABLE public.scheduled_posts (
    id character varying(255) NOT NULL,
    brand_id uuid NOT NULL,
    content_id character varying(255) NOT NULL,
    channels jsonb DEFAULT '[]'::jsonb NOT NULL,
    scheduled_at timestamp without time zone NOT NULL,
    status character varying(50) DEFAULT 'scheduled'::character varying,
    platform_post_ids jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.scheduled_posts OWNER TO ai_marketer;

--
-- Data for Name: analytics; Type: TABLE DATA; Schema: public; Owner: ai_marketer
--

COPY public.analytics (id, brand_id, content_id, channel, metric_type, metric_value, event_at, test_variant, conversion_value, conversion_type, click_id) FROM stdin;
\.


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: ai_marketer
--

COPY public.brands (id, name, short_description, long_description, categories, tone, audience, website_url, logo_url, key_products, canonical_pages, contact_email, extracted_keywords, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: content_drafts; Type: TABLE DATA; Schema: public; Owner: ai_marketer
--

COPY public.content_drafts (id, brand_id, type, content, status, metadata, test_variant, created_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: ai_marketer
--

COPY public.jobs (id, type, status, brand_id, data, result, error, retries, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: scheduled_posts; Type: TABLE DATA; Schema: public; Owner: ai_marketer
--

COPY public.scheduled_posts (id, brand_id, content_id, channels, scheduled_at, status, platform_post_ids, created_at, updated_at) FROM stdin;
\.


--
-- Name: analytics analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_marketer
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_pkey PRIMARY KEY (id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_marketer
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: content_drafts content_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_marketer
--

ALTER TABLE ONLY public.content_drafts
    ADD CONSTRAINT content_drafts_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_marketer
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: scheduled_posts scheduled_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_marketer
--

ALTER TABLE ONLY public.scheduled_posts
    ADD CONSTRAINT scheduled_posts_pkey PRIMARY KEY (id);


--
-- Name: idx_analytics_brand_id; Type: INDEX; Schema: public; Owner: ai_marketer
--

CREATE INDEX idx_analytics_brand_id ON public.analytics USING btree (brand_id);


--
-- Name: idx_analytics_click_id; Type: INDEX; Schema: public; Owner: ai_marketer
--

CREATE INDEX idx_analytics_click_id ON public.analytics USING btree (click_id);


--
-- Name: idx_analytics_content_id; Type: INDEX; Schema: public; Owner: ai_marketer
--

CREATE INDEX idx_analytics_content_id ON public.analytics USING btree (content_id);


--
-- Name: idx_analytics_content_test; Type: INDEX; Schema: public; Owner: ai_marketer
--

CREATE INDEX idx_analytics_content_test ON public.analytics USING btree (content_id, test_variant);


--
-- Name: idx_analytics_test_variant; Type: INDEX; Schema: public; Owner: ai_marketer
--

CREATE INDEX idx_analytics_test_variant ON public.analytics USING btree (test_variant);


--
-- Name: idx_content_drafts_brand_id; Type: INDEX; Schema: public; Owner: ai_marketer
--

CREATE INDEX idx_content_drafts_brand_id ON public.content_drafts USING btree (brand_id);


--
-- Name: idx_content_drafts_status; Type: INDEX; Schema: public; Owner: ai_marketer
--

CREATE INDEX idx_content_drafts_status ON public.content_drafts USING btree (status);


--
-- Name: idx_jobs_brand_id; Type: INDEX; Schema: public; Owner: ai_marketer
--

CREATE INDEX idx_jobs_brand_id ON public.jobs USING btree (brand_id);


--
-- Name: idx_jobs_status; Type: INDEX; Schema: public; Owner: ai_marketer
--

CREATE INDEX idx_jobs_status ON public.jobs USING btree (status);


--
-- Name: idx_jobs_type; Type: INDEX; Schema: public; Owner: ai_marketer
--

CREATE INDEX idx_jobs_type ON public.jobs USING btree (type);


--
-- Name: idx_scheduled_posts_brand_id; Type: INDEX; Schema: public; Owner: ai_marketer
--

CREATE INDEX idx_scheduled_posts_brand_id ON public.scheduled_posts USING btree (brand_id);


--
-- Name: idx_scheduled_posts_scheduled_at; Type: INDEX; Schema: public; Owner: ai_marketer
--

CREATE INDEX idx_scheduled_posts_scheduled_at ON public.scheduled_posts USING btree (scheduled_at);


--
-- Name: brands update_brands_updated_at; Type: TRIGGER; Schema: public; Owner: ai_marketer
--

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: jobs update_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: ai_marketer
--

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: scheduled_posts update_scheduled_posts_updated_at; Type: TRIGGER; Schema: public; Owner: ai_marketer
--

CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON public.scheduled_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: analytics analytics_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ai_marketer
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id);


--
-- Name: analytics analytics_click_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ai_marketer
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_click_id_fkey FOREIGN KEY (click_id) REFERENCES public.analytics(id);


--
-- Name: analytics analytics_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ai_marketer
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.content_drafts(id);


--
-- Name: content_drafts content_drafts_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ai_marketer
--

ALTER TABLE ONLY public.content_drafts
    ADD CONSTRAINT content_drafts_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id);


--
-- Name: jobs jobs_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ai_marketer
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id);


--
-- Name: scheduled_posts scheduled_posts_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ai_marketer
--

ALTER TABLE ONLY public.scheduled_posts
    ADD CONSTRAINT scheduled_posts_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id);


--
-- Name: scheduled_posts scheduled_posts_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ai_marketer
--

ALTER TABLE ONLY public.scheduled_posts
    ADD CONSTRAINT scheduled_posts_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.content_drafts(id);


--
-- PostgreSQL database dump complete
--

\unrestrict w8OT3G6YLRvyuzuDWdUzobhlGCZTCufDfOBXfbzX5MCWHzxPTiMjhnVwaTKPfdS

