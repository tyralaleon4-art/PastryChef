--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 16.9

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO neondb_owner;

--
-- Name: ingredient_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ingredient_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ingredient_categories OWNER TO neondb_owner;

--
-- Name: ingredients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ingredients (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    unit text NOT NULL,
    cost_per_unit numeric(10,4) NOT NULL,
    supplier text,
    current_stock numeric(10,3) DEFAULT '0'::numeric,
    minimum_stock numeric(10,3) DEFAULT '0'::numeric,
    expiry_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    category_id character varying,
    allergens json DEFAULT '[]'::json,
    is_vegan boolean DEFAULT false,
    is_gluten_free boolean DEFAULT false,
    is_lactose_free boolean DEFAULT false,
    density_g_per_ml numeric(6,3),
    weight_per_piece_g numeric(10,3)
);


ALTER TABLE public.ingredients OWNER TO neondb_owner;

--
-- Name: inventory_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.inventory_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    ingredient_id character varying NOT NULL,
    type text NOT NULL,
    quantity numeric(10,3) NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.inventory_logs OWNER TO neondb_owner;

--
-- Name: production_plan_recipes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.production_plan_recipes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    plan_id character varying NOT NULL,
    recipe_id character varying NOT NULL,
    target_weight numeric(10,2) NOT NULL,
    target_unit text DEFAULT 'g'::text NOT NULL,
    completed boolean DEFAULT false,
    completed_ingredients json DEFAULT '[]'::json,
    completed_instructions json DEFAULT '[]'::json
);


ALTER TABLE public.production_plan_recipes OWNER TO neondb_owner;

--
-- Name: production_plans; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.production_plans (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    archived boolean DEFAULT false NOT NULL
);


ALTER TABLE public.production_plans OWNER TO neondb_owner;

--
-- Name: recipe_ingredients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.recipe_ingredients (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    recipe_id character varying NOT NULL,
    ingredient_id character varying NOT NULL,
    quantity numeric(10,3) NOT NULL,
    unit text NOT NULL,
    notes text
);


ALTER TABLE public.recipe_ingredients OWNER TO neondb_owner;

--
-- Name: recipes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.recipes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category_id character varying,
    instructions json DEFAULT '[]'::json,
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    allergens json DEFAULT '[]'::json,
    is_vegan boolean DEFAULT false,
    is_gluten_free boolean DEFAULT false,
    is_lactose_free boolean DEFAULT false,
    total_yield_grams numeric(10,2)
);


ALTER TABLE public.recipes OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.categories (id, name, description, created_at) FROM stdin;
83846e5b-530a-45be-94e9-48a23328873e	baby	\N	2025-09-07 17:07:45.666217
493bc7dd-9f7c-41e5-9050-97e7fea350a5	ciastka	z koksem	2025-09-07 17:37:36.856256
99e513ac-5376-4f59-b908-e0126b820ad6	seniki	\N	2025-09-07 17:55:39.911905
9ccf2855-b9a9-49c3-b8bc-03f753fcdb50	cookies	\N	2025-09-14 14:12:28.215999
0d73cf48-1f56-465b-9563-f55fe2edae96	crumble	\N	2025-09-15 18:06:29.286054
3c87ee85-e754-45b2-a673-c00bc01bbf2f	musy	\N	2025-09-15 18:10:07.752224
e25dd92c-9d79-4166-b752-c9d34ce3d198	financier	\N	2025-09-15 18:28:09.628193
eb042bce-10da-4fe5-aaf6-d46cda135ea9	tiul	\N	2025-09-15 18:37:39.936315
2fa00540-95fb-42a2-b51e-c0412549d5a3	kremy	\N	2025-09-15 18:43:36.382153
d82600be-6059-4c19-bad3-acc25b66b4f5	lody	\N	2025-09-16 06:35:24.851668
3826528e-264c-4979-9a59-caafb80e5271	piany	\N	2025-09-16 06:42:26.453688
d3c3acc3-f453-4350-9049-5752a5fea1db	cremoux	\N	2025-09-16 18:00:06.589501
a8821cc0-034f-44d0-a86a-e12ed1a913bc	karmele	\N	2025-09-16 18:11:01.780674
0a753f19-fb82-45e1-96d1-ba5bbe96875b	żele	\N	2025-09-24 11:57:39.316066
c8cd779f-a911-4281-a6e6-cdda9dbd5a50	drożdżowe	\N	2025-09-25 03:52:22.667731
edcffee2-22d9-4e6e-b008-3ccc5f1a41c5	bezy	\N	2025-09-25 04:02:17.950807
9e73da0a-5129-4407-8088-3a42f49f9ea6	sosy	\N	2025-09-25 04:06:06.231681
\.


--
-- Data for Name: ingredient_categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ingredient_categories (id, name, description, created_at) FROM stdin;
7786ceb9-53b4-4653-bf16-aa89dc49a9b2	słodziki	\N	2025-09-07 16:50:15.077394
3fdfce54-7500-4e77-9900-4a5fdf986dcb	mąki	\N	2025-09-07 17:24:36.902925
e0466529-a40c-4da5-aabc-ca220f1d2fb0	drożdzowe	na zakwasie	2025-09-10 15:14:47.044772
20b942c9-28a3-4565-8770-626791feb765	białka	\N	2025-09-11 20:09:33.386397
6b557248-7840-49ca-9184-3865f0d7adee	nabiał	\N	2025-09-14 13:58:52.345238
c4e92f49-c587-4a1f-925e-9626b8b81835	czekolady	\N	2025-09-14 14:00:54.80451
5cbdb637-f82c-4897-858c-7e1a2f7290b5	pasty orzechowe	\N	2025-09-14 14:02:46.295895
86dd9858-35a2-45a7-888c-9ef99e533726	dodatki	\N	2025-09-14 14:09:24.83909
f91f4f00-c608-4b96-b262-0ea4c21a0018	struktury	\N	2025-09-14 14:10:44.582525
16602704-cd46-4164-a0e2-908a7096edb8	przyprawy	\N	2025-09-15 18:05:34.24852
2b70dca7-3254-4d9b-9dff-3cf304869334	purre	\N	2025-09-15 18:11:03.431119
ad14bfcf-dbf0-4ed8-ae24-db9ed793844a	orzechy	\N	2025-09-15 18:36:07.34852
31f90954-7ba8-4337-898c-24002d7f9bfa	alkochole	\N	2025-09-16 06:39:18.317277
2dd62e05-dc1d-4279-ac9b-e1ecfd30a540	ciastka	\N	2025-09-16 06:40:54.52927
77ef40b7-0041-4e2f-9e19-814ad71d8fec	owoce świeże	\N	2025-09-24 11:52:40.806781
1258817f-5871-43db-ab3d-d879beb05c30	kiszone	\N	2025-09-24 11:54:25.322325
393c372b-eae9-458a-9cf9-13ab9c0d9da8	octy	\N	2025-09-24 11:55:41.223744
d9ca4d43-980f-4303-9bb8-8f772d2d8632	owoce przetworzone	\N	2025-09-24 14:59:13.257346
\.


--
-- Data for Name: ingredients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ingredients (id, name, unit, cost_per_unit, supplier, current_stock, minimum_stock, expiry_date, created_at, category_id, allergens, is_vegan, is_gluten_free, is_lactose_free, density_g_per_ml, weight_per_piece_g) FROM stdin;
e7104e46-d788-45eb-b28f-bb778cb4309b	żółtko pasteryzowane	kg	88.0000	elfix	0.000	0.000	\N	2025-09-16 06:34:16.325785	6b557248-7840-49ca-9184-3865f0d7adee	["Eggs"]	f	t	t	\N	\N
36b0c4dc-07df-46ad-a0f7-2d694a118fd8	kakao extra brute	kg	120.0000	cacao barry	0.000	0.000	\N	2025-09-16 06:34:56.737772	c4e92f49-c587-4a1f-925e-9626b8b81835	[]	t	t	t	\N	\N
bb6758c2-c205-4842-a868-a74241349346	espresso	kg	55.0000	\N	0.000	0.000	\N	2025-09-16 06:33:21.804196	86dd9858-35a2-45a7-888c-9ef99e533726	[]	t	t	t	\N	\N
f167b495-e81d-4026-aca6-277c6ad3a610	kawa w ziarnach	kg	90.0000	\N	0.000	0.000	\N	2025-09-16 06:38:59.280781	86dd9858-35a2-45a7-888c-9ef99e533726	[]	t	t	t	\N	\N
49003e9a-4b5d-46f2-8dbf-fb1ab718430f	czekolada mleczna ghana	kg	125.0000	cacao barry	0.000	0.000	\N	2025-09-16 17:59:20.93726	c4e92f49-c587-4a1f-925e-9626b8b81835	["Milk"]	f	t	f	\N	\N
cbc5ec7e-4509-4486-8c51-6b6943a1a20c	cukier	kg	2.8000	cukier polski	0.000	20.000	\N	2025-09-07 16:50:37.564824	7786ceb9-53b4-4653-bf16-aa89dc49a9b2	[]	t	t	t	\N	\N
45594b4f-1123-46d7-b523-8431d123e64d	mascarpone	kg	25.0000	\N	0.000	0.000	\N	2025-09-16 06:39:51.072164	6b557248-7840-49ca-9184-3865f0d7adee	["Milk"]	f	t	f	\N	\N
94ad247f-b541-4264-bbd2-c1d81d6ebf85	soda oczyszczona	kg	5.0000	\N	0.000	0.000	\N	2025-09-16 18:05:43.299832	86dd9858-35a2-45a7-888c-9ef99e533726	[]	t	t	t	\N	\N
72bb18e1-a728-4768-b82d-0b78d6ceafbd	masło	kg	42.0000	osełka	0.000	5.000	\N	2025-09-11 19:49:40.489421	6b557248-7840-49ca-9184-3865f0d7adee	["Milk"]	f	t	f	\N	\N
7026a064-1ae3-4135-8793-769b623c5a19	pasta z orzecha laskowego	kg	79.0000	barima	0.000	0.000	\N	2025-09-14 14:02:46.298769	5cbdb637-f82c-4897-858c-7e1a2f7290b5	["Peanuts","Nuts"]	t	t	t	\N	\N
a48c0704-32d6-4414-936c-5882a7194ad1	biała czekolada velvet	kg	65.0000	callebaut	0.000	15.000	\N	2025-09-14 14:00:54.805597	c4e92f49-c587-4a1f-925e-9626b8b81835	["Milk","Soybeans"]	f	t	f	\N	\N
be1b6cef-c2a7-4c2b-bcc9-a28d9f3cc14e	cukier brązowy	kg	12.0000	diamant	0.000	0.000	\N	2025-09-14 14:07:09.381571	7786ceb9-53b4-4653-bf16-aa89dc49a9b2	[]	t	t	t	\N	\N
24ba475b-23c5-4f6e-8ccc-210844f94ed7	jaja pasteryzowane	kg	48.0000	eifix	0.000	0.000	\N	2025-09-14 14:08:46.760612	6b557248-7840-49ca-9184-3865f0d7adee	["Eggs"]	f	t	t	\N	\N
7a1c7f57-aa63-4cab-9d14-d827e99ad580	sól	kg	2.1000	\N	0.000	0.000	\N	2025-09-14 14:09:25.093857	86dd9858-35a2-45a7-888c-9ef99e533726	[]	t	t	t	\N	\N
6816d50e-462f-4741-8263-67fab059f846	Proszek do pieczenia	kg	16.0000	\N	0.000	0.000	\N	2025-09-14 14:10:44.860192	f91f4f00-c608-4b96-b262-0ea4c21a0018	["Gluten"]	t	f	t	\N	\N
6ac61d5f-ea36-42ba-a350-31b4f1b88cb7	mąka migdałowa	kg	38.0000	\N	0.000	0.000	\N	2025-09-14 14:11:56.898225	3fdfce54-7500-4e77-9900-4a5fdf986dcb	["Peanuts","Nuts"]	t	t	t	\N	\N
0445a1bf-99f5-4a3d-9ce8-5452bfb8da36	mąka pszenna	kg	2.7000	\N	0.000	0.000	\N	2025-09-14 14:15:12.307067	3fdfce54-7500-4e77-9900-4a5fdf986dcb	["Gluten"]	t	f	t	\N	\N
50364ff6-c8fe-4a1e-a3ac-f9eafac775ec	różowy pieprz	kg	88.0000	\N	0.000	0.000	\N	2025-09-15 18:05:34.888949	16602704-cd46-4164-a0e2-908a7096edb8	[]	t	t	t	\N	\N
55162fc8-9c86-4ce5-a186-a9b2464d7b22	purre mango	kg	15.0000	\N	0.000	0.000	\N	2025-09-15 18:11:03.656599	2b70dca7-3254-4d9b-9dff-3cf304869334	[]	t	t	t	\N	\N
9d549928-0981-4553-8481-13718cb42be9	sok z limonki	kg	41.0000	\N	0.000	0.000	\N	2025-09-15 18:12:17.058279	2b70dca7-3254-4d9b-9dff-3cf304869334	[]	t	t	t	\N	\N
f190de96-84bd-44bb-83fc-4b8b2ec8a307	żelatyna w listkach bloom 180	kg	140.0000	\N	0.000	0.000	\N	2025-09-15 18:13:23.50023	f91f4f00-c608-4b96-b262-0ea4c21a0018	[]	f	t	t	\N	\N
881e2f7e-7dd0-4b2f-9c5d-51746e5f6db8	białka pasteryzowane	kg	37.0000	\N	0.000	0.000	\N	2025-09-15 18:14:16.900626	6b557248-7840-49ca-9184-3865f0d7adee	["Eggs"]	f	t	t	\N	\N
ac304698-8e35-4813-97f9-2f0b346f930e	trehaloza	kg	165.0000	\N	0.000	0.000	\N	2025-09-15 18:16:05.722859	7786ceb9-53b4-4653-bf16-aa89dc49a9b2	[]	t	t	t	\N	\N
142ac974-795d-43c1-a140-f2c10fce2fb4	śmietanka 31%	kg	15.0000	\N	0.000	0.000	\N	2025-09-15 18:17:27.677746	6b557248-7840-49ca-9184-3865f0d7adee	["Milk"]	f	t	f	\N	\N
193f1cf7-62f2-4d1e-a7f2-75b76e06a837	mączka z orzecha laskowego	kg	55.0000	\N	0.000	0.000	\N	2025-09-15 18:27:06.436512	3fdfce54-7500-4e77-9900-4a5fdf986dcb	["Nuts"]	t	t	t	\N	\N
416b594f-cd70-499e-af6a-b51a8c7c31b8	masło palone	kg	55.0000	\N	0.000	0.000	\N	2025-09-15 18:27:47.117753	6b557248-7840-49ca-9184-3865f0d7adee	["Milk"]	f	t	f	\N	\N
675363de-7da3-4e7f-9bcd-70950576cf75	syrop glukozowy	kg	12.0000	\N	0.000	0.000	\N	2025-09-15 18:33:44.730111	7786ceb9-53b4-4653-bf16-aa89dc49a9b2	["Gluten"]	t	f	t	\N	\N
14fbc8f8-26a5-4b7d-8f98-ea4cdb244da2	mleko 3,2%	kg	3.8000	\N	0.000	0.000	\N	2025-09-15 18:34:36.2408	6b557248-7840-49ca-9184-3865f0d7adee	["Milk"]	f	t	f	\N	\N
b2051280-5be1-4732-b996-d9beaac1a525	pektyna NH	kg	200.0000	\N	0.000	0.000	\N	2025-09-15 18:35:27.05622	f91f4f00-c608-4b96-b262-0ea4c21a0018	[]	t	t	t	\N	\N
30b1e950-c84a-48d8-9748-8c92ac81bc75	orzech laskowy prażony	kg	55.0000	\N	0.000	0.000	\N	2025-09-15 18:36:07.577969	ad14bfcf-dbf0-4ed8-ae24-db9ed793844a	["Nuts"]	t	t	t	\N	\N
2272227b-6c3c-45ff-bdf0-7b95cc0aef5d	nibsy kakaowe	kg	110.0000	\N	0.000	0.000	\N	2025-09-15 18:37:06.269938	86dd9858-35a2-45a7-888c-9ef99e533726	[]	t	t	t	\N	\N
e8b231ec-ec37-4d84-9f0a-cc22e490dd9b	zest z limonki	kg	120.0000	\N	0.000	0.000	\N	2025-09-15 18:43:04.821359	2b70dca7-3254-4d9b-9dff-3cf304869334	[]	t	t	t	\N	\N
7b0fd27f-da99-4439-8768-07adc2f3d340	vanilia laska	kg	350.0000	\N	0.000	0.000	\N	2025-09-16 06:41:49.639055	86dd9858-35a2-45a7-888c-9ef99e533726	[]	t	t	t	\N	\N
118cff31-fcb0-4d38-bb0d-5bbc5ea12145	cukier puder	kg	5.0000	\N	0.000	0.000	\N	2025-09-16 06:49:22.704578	7786ceb9-53b4-4653-bf16-aa89dc49a9b2	[]	t	t	t	\N	\N
a05f5b1f-939d-4585-a60e-e9714b517ebe	zeylon czekolada	kg	82.0000	chocovic	0.000	0.000	\N	2025-09-16 18:10:26.158797	c4e92f49-c587-4a1f-925e-9626b8b81835	["Milk"]	f	t	f	\N	\N
c737c493-6149-42ee-89b1-69efb662601d	amaretto	kg	75.0000	\N	0.000	0.000	\N	2025-09-16 06:39:18.234802	31f90954-7ba8-4337-898c-24002d7f9bfa	[]	t	t	t	\N	\N
6292d6bc-8e04-4934-96f8-096ff502b48d	biszkopty sacoiardi	kg	35.0000	\N	0.000	0.000	\N	2025-09-16 06:40:54.552619	2dd62e05-dc1d-4279-ac9b-e1ecfd30a540	["Gluten","Eggs","Milk"]	f	f	f	\N	\N
2e0a6a8d-8e5a-485b-8360-1309481e4ee7	skrobia ziemniaczana	kg	9.0000	\N	0.000	0.000	\N	2025-09-16 06:50:01.903218	3fdfce54-7500-4e77-9900-4a5fdf986dcb	[]	t	t	t	\N	\N
d28cf334-1c94-42c7-b5f8-0bca979dc1e0	cukier inwertowany	kg	51.0000	\N	0.000	0.000	\N	2025-09-16 17:49:15.125524	7786ceb9-53b4-4653-bf16-aa89dc49a9b2	[]	t	t	t	\N	\N
70f4effc-b9b1-46ab-8d5c-ecee5be2ec51	czarny pieprz ziarno	kg	18.0000	\N	0.000	0.000	\N	2025-09-16 17:56:47.085737	16602704-cd46-4164-a0e2-908a7096edb8	[]	f	f	f	\N	\N
a15931d0-8188-4581-ba27-e345c782c9f0	tobado czekolada	kg	85.0000	\N	0.000	0.000	\N	2025-09-16 17:57:54.184977	c4e92f49-c587-4a1f-925e-9626b8b81835	[]	t	t	t	\N	\N
23893ab7-24d1-48dc-a9d9-e6d6011d0f46	kawa mielona	kg	50.0000	\N	0.000	0.000	\N	2025-09-16 18:19:45.087106	86dd9858-35a2-45a7-888c-9ef99e533726	[]	t	t	t	\N	\N
e538fe30-f3c8-4b0f-81d4-5ba8ad53cb20	kawa rozpuszczalna	kg	30.0000	\N	0.000	0.000	\N	2025-09-16 18:20:09.640724	86dd9858-35a2-45a7-888c-9ef99e533726	[]	t	t	t	\N	\N
b57e2a37-fdd4-4a1e-b59b-2aaacc331d06	purre kokos	kg	85.0000	\N	0.000	0.000	\N	2025-09-16 18:24:20.317982	2b70dca7-3254-4d9b-9dff-3cf304869334	[]	t	t	t	\N	\N
f57a34ca-a5a1-43d7-94b6-8c5e140be225	neutro 3	kg	204.0000	\N	0.000	0.000	\N	2025-09-16 18:26:05.913766	f91f4f00-c608-4b96-b262-0ea4c21a0018	["Eggs","Milk","Soybeans"]	f	t	f	\N	\N
4117fd7d-cfd9-41af-b83c-d8e4dcaa13d1	pasta z pistacji 100%	kg	280.0000	\N	0.000	0.000	\N	2025-09-21 09:26:10.488131	5cbdb637-f82c-4897-858c-7e1a2f7290b5	["Nuts"]	t	t	t	\N	\N
32411ce9-9b99-4704-a09e-6980cb3e8880	zielona pistacja sycylijska	kg	200.0000	\N	0.000	0.000	\N	2025-09-21 09:26:50.439078	ad14bfcf-dbf0-4ed8-ae24-db9ed793844a	["Nuts"]	t	t	t	\N	\N
52cd4949-8af4-4705-b8c9-1f897d7d08b8	ocet balsamiczny	kg	70.0000	\N	0.000	0.000	\N	2025-09-24 11:55:41.218884	393c372b-eae9-458a-9cf9-13ab9c0d9da8	[]	t	t	t	\N	\N
9eeb3abb-80e3-4100-b052-577d662dd4ac	kiszona cytryna	kg	42.0000	\N	0.000	0.000	\N	2025-09-24 11:54:25.965486	1258817f-5871-43db-ab3d-d879beb05c30	[]	t	t	t	\N	\N
52d97950-2075-4107-bd53-d021cf65d894	śliwka świeża	kg	8.0000	\N	0.000	0.000	\N	2025-09-24 11:52:40.80792	77ef40b7-0041-4e2f-9e19-814ad71d8fec	[]	t	t	t	\N	\N
ee1b6b8c-e5c1-46f5-8d01-9ab87a2c7ede	skórka z cytryny	kg	30.0000	\N	0.000	0.000	\N	2025-09-24 11:57:03.140021	77ef40b7-0041-4e2f-9e19-814ad71d8fec	[]	t	t	t	\N	\N
3b9ac64b-f1b3-4f67-9161-6d834ef3d3d3	agar agar	kg	80.0000	\N	0.000	0.000	\N	2025-09-24 12:02:10.401052	f91f4f00-c608-4b96-b262-0ea4c21a0018	[]	t	t	t	\N	\N
daea9244-f949-4d5f-a2b5-1fa20afd921a	maślanka	kg	7.5000	\N	0.000	0.000	\N	2025-09-24 12:05:08.709133	6b557248-7840-49ca-9184-3865f0d7adee	[]	f	f	f	\N	\N
078add0d-aa01-43e5-8276-785dc9ab931a	śliwka suszona	kg	30.0000	\N	0.000	0.000	\N	2025-09-24 14:59:13.258506	d9ca4d43-980f-4303-9bb8-8f772d2d8632	["Sulfites"]	t	t	t	\N	\N
9d68c217-549b-46c3-adc4-b334b1bda37e	drożdże świeże	kg	30.0000	\N	0.000	0.000	\N	2025-09-25 03:50:30.066266	86dd9858-35a2-45a7-888c-9ef99e533726	[]	f	f	f	\N	\N
123c658e-4cea-49f8-a391-85ca201925e2	purre żurawina	kg	35.0000	\N	0.000	0.000	\N	2025-09-25 04:01:26.300971	2b70dca7-3254-4d9b-9dff-3cf304869334	[]	t	t	t	\N	\N
6faee840-e1a9-4551-8388-81e091749687	albumina	kg	170.0000	\N	0.000	0.000	\N	2025-09-25 04:01:51.556078	f91f4f00-c608-4b96-b262-0ea4c21a0018	["Eggs"]	f	t	t	\N	\N
4484bff8-561f-4bba-9220-374ff9987ae7	śliwowica	kg	90.0000	\N	0.000	0.000	\N	2025-09-25 04:10:28.655003	31f90954-7ba8-4337-898c-24002d7f9bfa	[]	t	t	t	\N	\N
4e37f79e-2f56-484b-869d-ad5c371e6d76	purre śliwka	kg	60.0000	\N	0.000	0.000	\N	2025-09-25 04:11:34.582726	\N	[]	t	t	t	\N	\N
\.


--
-- Data for Name: inventory_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.inventory_logs (id, ingredient_id, type, quantity, notes, created_at) FROM stdin;
\.


--
-- Data for Name: production_plan_recipes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.production_plan_recipes (id, plan_id, recipe_id, target_weight, target_unit, completed, completed_ingredients, completed_instructions) FROM stdin;
3779835d-c226-4875-ad24-54dbd499f2a2	90a4cb7d-0c52-4b13-b115-ee0cda1a4316	d099f0c2-15d1-47bc-a922-c3f7888ecab7	188.00	g	t	[]	[]
4466ec00-9c33-4be2-80d2-f17c18aad79b	90a4cb7d-0c52-4b13-b115-ee0cda1a4316	d1ae9489-2332-4839-9e26-e971857de3cf	455.00	g	t	[]	[]
e2154e74-b5f6-42fd-ab28-f493eba73b40	149b6696-0c2b-4220-afed-dafc3e5f7d87	3440ede8-81d8-4495-8dd1-a940635a0cca	500.00	g	t	[]	[]
0c320cb1-1cdb-4afa-945f-8dea70f2117c	149b6696-0c2b-4220-afed-dafc3e5f7d87	cef2c94c-c14f-4b4b-8d73-f131f87065be	1.00	kg	t	[]	[]
b75bdb28-3cfb-46a2-b78a-dacfe4fac3e2	dfa63b61-0c29-494a-becd-1111397e8a00	02da0056-26c6-4884-b0a2-edd9e99ef0fe	400.00	g	f	[]	[]
0f316987-b62d-4a16-8a48-09c966b4d3b3	dfa63b61-0c29-494a-becd-1111397e8a00	d099f0c2-15d1-47bc-a922-c3f7888ecab7	300.00	g	f	[]	[]
f09b30a9-794f-47a4-b002-597a81eea122	dfa63b61-0c29-494a-becd-1111397e8a00	2d092257-86bf-407b-9cfc-32b7b7cf94dc	500.00	g	f	[]	[]
73838fda-1136-4502-a091-b75eac2c8a82	dfa63b61-0c29-494a-becd-1111397e8a00	5a9c40f7-6912-41e8-a900-be21f2b87de7	300.00	g	f	[]	[]
dad41604-d853-406e-94a5-c5e18ef53ca8	dfa63b61-0c29-494a-becd-1111397e8a00	c2b91acb-81f2-4422-b4be-ec4154e57373	300.00	g	f	[]	[]
15d8c87a-e07e-4f73-958f-44f8ff9a93ac	29660b54-5d27-45c6-93b0-2efe387d7a8d	5a9c40f7-6912-41e8-a900-be21f2b87de7	1000.00	g	f	[]	[]
56651f93-89bd-4351-8cbd-45d406dd0720	dfa63b61-0c29-494a-becd-1111397e8a00	39f3f627-527a-4317-b5b0-aa8aae07cee2	400.00	g	t	[]	[]
16696d28-777b-4be9-a94e-4111edec45a2	dfa63b61-0c29-494a-becd-1111397e8a00	ae50dca1-1aac-4b3d-b832-fc6e67a2435f	900.00	g	t	[]	[]
4430a0ce-7e93-467b-8dd7-b2e7d067c71b	dfa63b61-0c29-494a-becd-1111397e8a00	e867ceb7-52f2-4a88-b190-7451cc753890	400.00	g	t	[]	[]
56f775ed-5ebc-4556-953b-337e99d1fdf5	dfa63b61-0c29-494a-becd-1111397e8a00	b4c27b75-959b-4c4b-bf7a-b43ad2dfa9be	400.00	g	t	[]	[]
\.


--
-- Data for Name: production_plans; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.production_plans (id, name, description, status, created_at, updated_at, archived) FROM stdin;
149b6696-0c2b-4220-afed-dafc3e5f7d87	Plan testowy MbIE5U	Opis planu testowego	active	2025-09-23 18:33:58.891197	2025-09-23 19:02:31.83	t
90a4cb7d-0c52-4b13-b115-ee0cda1a4316	23.09.2025		active	2025-09-23 18:36:36.959176	2025-09-23 19:02:35.039	t
dfa63b61-0c29-494a-becd-1111397e8a00	kadra 27.09.2025		active	2025-09-24 12:10:19.758717	2025-09-24 12:10:19.758717	f
e06d8ac1-73fc-41cc-9521-60150ace9cc9	kadra 27.09.2025#1		active	2025-09-25 03:48:14.433728	2025-09-25 03:48:14.433728	f
29660b54-5d27-45c6-93b0-2efe387d7a8d	Test Mobile Plan Qwobuk	Automated mobile test plan	active	2025-09-27 06:55:12.574321	2025-09-27 06:55:12.574321	f
\.


--
-- Data for Name: recipe_ingredients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, notes) FROM stdin;
3c06c700-a5f7-40a4-8fa0-52684d808191	8a9fcad2-df28-46f6-8368-39705f781aef	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	8.000	g	\N
ae158336-0a94-46fa-a712-0f0aadda2cad	1fad514b-6d08-4054-a740-4ca51aebb80e	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	600.000	g	\N
5921fca2-85e6-4cba-8c93-e5248f4c9e84	47a2a66d-b87e-417b-b9d2-085e9b0a8425	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	3.000	g	\N
fbd65494-2c16-4810-a3ea-e06b130d31bd	e9bcd9ce-243a-48d7-acfd-dd1baa845fa3	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	299.000	g	\N
32f8708f-f477-4de8-a340-11d15ad47223	9413c47c-9afe-4348-9b9a-752e7be3e21d	14fbc8f8-26a5-4b7d-8f98-ea4cdb244da2	390.000	g	\N
87fcf1bf-b62e-47b3-aa4d-7d96a48f08db	9413c47c-9afe-4348-9b9a-752e7be3e21d	d28cf334-1c94-42c7-b5f8-0bca979dc1e0	20.000	g	\N
3a77996e-5fd6-4688-ad53-98201553d704	9413c47c-9afe-4348-9b9a-752e7be3e21d	e7104e46-d788-45eb-b28f-bb778cb4309b	125.000	g	\N
37d11cce-cb34-4342-a218-9c808c3ad84a	9413c47c-9afe-4348-9b9a-752e7be3e21d	a15931d0-8188-4581-ba27-e345c782c9f0	255.000	g	\N
a4e40f78-0e4b-43e3-aa1f-971d38cce560	c0211b65-d851-40f8-858d-398d16840c2e	72bb18e1-a728-4768-b82d-0b78d6ceafbd	150.000	g	\N
e5275697-5e50-4287-853d-607e3394c236	c0211b65-d851-40f8-858d-398d16840c2e	72bb18e1-a728-4768-b82d-0b78d6ceafbd	50.000	g	\N
1ffc0f29-ebf1-4cd2-a380-590b3baa6f57	9413c47c-9afe-4348-9b9a-752e7be3e21d	70f4effc-b9b1-46ab-8d5c-ecee5be2ec51	8.500	g	\N
a7db2fda-f9cc-470f-b689-cc0a971927a7	9413c47c-9afe-4348-9b9a-752e7be3e21d	49003e9a-4b5d-46f2-8dbf-fb1ab718430f	60.000	g	\N
c9456570-17b9-45e7-999f-2d8df7a3e9d0	a8ec8dd9-3bb1-4326-bcce-ef3b384538f4	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	155.000	g	\N
b327dcc1-84d9-4db6-a935-97641720d9d9	9882b5ce-d7c5-443b-a9d1-a70d25f5d930	72bb18e1-a728-4768-b82d-0b78d6ceafbd	480.000	g	\N
c5ca3f60-b760-4b62-b3a4-678a58b2ec80	9882b5ce-d7c5-443b-a9d1-a70d25f5d930	a48c0704-32d6-4414-936c-5882a7194ad1	200.000	g	\N
e3800938-eb18-4850-88eb-333f32cd19ea	9882b5ce-d7c5-443b-a9d1-a70d25f5d930	7026a064-1ae3-4135-8793-769b623c5a19	400.000	g	\N
a0294d8a-f725-4d1e-93ee-dc1af7aecb7a	9882b5ce-d7c5-443b-a9d1-a70d25f5d930	be1b6cef-c2a7-4c2b-bcc9-a28d9f3cc14e	800.000	g	\N
97dcb823-144d-4ae5-b2de-1964bbd48e54	9882b5ce-d7c5-443b-a9d1-a70d25f5d930	24ba475b-23c5-4f6e-8ccc-210844f94ed7	400.000	g	\N
c642f3bd-1cef-43a2-a539-e7cb244839a8	9882b5ce-d7c5-443b-a9d1-a70d25f5d930	7a1c7f57-aa63-4cab-9d14-d827e99ad580	8.000	g	\N
1063b90c-d32f-42bc-acdc-0258016ac00d	9882b5ce-d7c5-443b-a9d1-a70d25f5d930	6816d50e-462f-4741-8263-67fab059f846	20.000	g	\N
e488ded1-d03a-41b4-83c9-f53eace44371	9882b5ce-d7c5-443b-a9d1-a70d25f5d930	0445a1bf-99f5-4a3d-9ce8-5452bfb8da36	880.000	g	\N
5b00f3de-b043-4845-862e-6165bc207cc7	9882b5ce-d7c5-443b-a9d1-a70d25f5d930	6ac61d5f-ea36-42ba-a350-31b4f1b88cb7	200.000	g	\N
70251e29-db58-42a4-8bc7-cb7b46880aa0	d25a9448-3cad-4876-8561-07f299a2656f	6816d50e-462f-4741-8263-67fab059f846	250.000	ml	\N
18633784-fa18-4828-90a8-7f6c78f71afa	d25a9448-3cad-4876-8561-07f299a2656f	6816d50e-462f-4741-8263-67fab059f846	2.000	pcs	\N
47b77145-2353-48dc-a560-d51e672b653c	3ce0a257-cb35-4e1c-a1e8-7b8024f47fde	55162fc8-9c86-4ce5-a186-a9b2464d7b22	525.000	g	\N
1c844579-b2ff-40c0-8b94-1e8e77593b46	3ce0a257-cb35-4e1c-a1e8-7b8024f47fde	9d549928-0981-4553-8481-13718cb42be9	35.000	g	\N
bf5e53de-55e7-419e-9679-dc6220b257a6	3ce0a257-cb35-4e1c-a1e8-7b8024f47fde	f190de96-84bd-44bb-83fc-4b8b2ec8a307	9.500	g	\N
ca5f51af-7306-4113-a535-486a319efbb8	3ce0a257-cb35-4e1c-a1e8-7b8024f47fde	881e2f7e-7dd0-4b2f-9c5d-51746e5f6db8	120.000	g	\N
4ca77516-a73e-4245-94a8-5608b2b6d6b9	3ce0a257-cb35-4e1c-a1e8-7b8024f47fde	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	65.000	g	\N
1cc9901d-8d86-4853-9f42-aef8600c6b41	3ce0a257-cb35-4e1c-a1e8-7b8024f47fde	ac304698-8e35-4813-97f9-2f0b346f930e	50.000	g	\N
7357a027-8611-4cf8-b7ed-c068a94db6d8	3ce0a257-cb35-4e1c-a1e8-7b8024f47fde	142ac974-795d-43c1-a140-f2c10fce2fb4	140.000	g	\N
6ccb7037-d54e-4c31-a52a-284735e0091c	71c25c9d-2ff1-47ca-8d08-17678a61355c	72bb18e1-a728-4768-b82d-0b78d6ceafbd	100.000	g	\N
a08d8e52-43f6-465d-98cf-1445e3d51727	71c25c9d-2ff1-47ca-8d08-17678a61355c	0445a1bf-99f5-4a3d-9ce8-5452bfb8da36	110.000	g	\N
95e87c7f-cb41-4aaa-a794-4e058c815da0	71c25c9d-2ff1-47ca-8d08-17678a61355c	6ac61d5f-ea36-42ba-a350-31b4f1b88cb7	90.000	g	\N
d6f882ca-fe4b-46c4-af91-84aea6c34ae7	71c25c9d-2ff1-47ca-8d08-17678a61355c	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	90.000	g	\N
9bae8fb1-624f-4e33-9455-a6131c924960	71c25c9d-2ff1-47ca-8d08-17678a61355c	7a1c7f57-aa63-4cab-9d14-d827e99ad580	2.000	g	\N
e028d2b7-998c-4f16-8bd9-5560f913eac7	71c25c9d-2ff1-47ca-8d08-17678a61355c	50364ff6-c8fe-4a1e-a3ac-f9eafac775ec	4.500	g	\N
f97f8d2e-d7cb-4ac9-8884-8c3e0639fc07	e867ceb7-52f2-4a88-b190-7451cc753890	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	350.000	g	\N
ac4c818c-bc62-48f6-a1db-bb90a7dd5922	e867ceb7-52f2-4a88-b190-7451cc753890	193f1cf7-62f2-4d1e-a7f2-75b76e06a837	150.000	g	\N
f9b528df-bf90-4a27-9ac5-00784d91bc2d	e867ceb7-52f2-4a88-b190-7451cc753890	0445a1bf-99f5-4a3d-9ce8-5452bfb8da36	130.000	g	\N
7bd5753d-f29d-4280-9c9e-906309692152	e867ceb7-52f2-4a88-b190-7451cc753890	7a1c7f57-aa63-4cab-9d14-d827e99ad580	2.000	g	\N
50053b9f-d39a-4cba-adec-f1a4e2958e31	e867ceb7-52f2-4a88-b190-7451cc753890	6816d50e-462f-4741-8263-67fab059f846	6.000	g	\N
e632f0dd-5727-4bb0-9a22-951dcfd6d052	e867ceb7-52f2-4a88-b190-7451cc753890	881e2f7e-7dd0-4b2f-9c5d-51746e5f6db8	360.000	g	\N
61cd9e26-2040-4450-a664-a7cbfcd6c4fc	e867ceb7-52f2-4a88-b190-7451cc753890	7026a064-1ae3-4135-8793-769b623c5a19	40.000	g	\N
6bcc40c7-71ac-4ceb-a1ea-ce5a786b401c	e867ceb7-52f2-4a88-b190-7451cc753890	416b594f-cd70-499e-af6a-b51a8c7c31b8	180.000	g	\N
a6b905aa-feaa-4185-b180-a36aa2f348aa	69a8a772-c39b-4226-a8a5-de78975bcb82	14fbc8f8-26a5-4b7d-8f98-ea4cdb244da2	65.000	g	\N
95c5e98c-18e5-4609-a915-1343fcd68ffd	69a8a772-c39b-4226-a8a5-de78975bcb82	675363de-7da3-4e7f-9bcd-70950576cf75	50.000	g	\N
a5e278b9-396d-49b0-b609-fa5492d73ee7	69a8a772-c39b-4226-a8a5-de78975bcb82	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	150.000	g	\N
ad1929f5-7235-49be-b958-8c9803e64ad9	69a8a772-c39b-4226-a8a5-de78975bcb82	b2051280-5be1-4732-b996-d9beaac1a525	2.500	g	\N
e3ed6f7e-1e33-4588-b0b8-834f1610fcac	69a8a772-c39b-4226-a8a5-de78975bcb82	72bb18e1-a728-4768-b82d-0b78d6ceafbd	125.000	g	\N
af18d298-83f9-4d82-910c-ddd83ec5e53e	69a8a772-c39b-4226-a8a5-de78975bcb82	2272227b-6c3c-45ff-bdf0-7b95cc0aef5d	100.000	g	\N
07300a14-f2d6-4042-933c-6cfcb62f5471	69a8a772-c39b-4226-a8a5-de78975bcb82	30b1e950-c84a-48d8-9748-8c92ac81bc75	100.000	g	\N
1baea79c-5293-46ed-a5bf-6ea52563a5d1	211e512c-a599-44e5-9925-1ea94a120a1c	f190de96-84bd-44bb-83fc-4b8b2ec8a307	1.000	g	\N
3bdfce33-efda-45b7-a401-4e9d641c8d29	211e512c-a599-44e5-9925-1ea94a120a1c	9d549928-0981-4553-8481-13718cb42be9	216.000	g	\N
514960af-fd2b-4f3a-8ffd-4740f602b450	211e512c-a599-44e5-9925-1ea94a120a1c	e8b231ec-ec37-4d84-9f0a-cc22e490dd9b	7.000	g	\N
20e31b30-8165-4c42-bca0-65ab1963dbe7	211e512c-a599-44e5-9925-1ea94a120a1c	881e2f7e-7dd0-4b2f-9c5d-51746e5f6db8	86.000	g	\N
58040b35-0338-467d-a578-2e19b33bd7a6	211e512c-a599-44e5-9925-1ea94a120a1c	24ba475b-23c5-4f6e-8ccc-210844f94ed7	72.000	g	\N
63cdfe6b-864f-40be-9ac0-6c15ac4068fa	211e512c-a599-44e5-9925-1ea94a120a1c	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	54.000	g	\N
420d8e99-e3cf-4132-bb06-6b51230aaba6	211e512c-a599-44e5-9925-1ea94a120a1c	a48c0704-32d6-4414-936c-5882a7194ad1	189.000	g	\N
0a28057d-828b-40b6-8335-7c5242e0b818	a8ec8dd9-3bb1-4326-bcce-ef3b384538f4	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	140.000	g	\N
6505e284-d39a-4349-aaf2-0ccb228acd52	a8ec8dd9-3bb1-4326-bcce-ef3b384538f4	142ac974-795d-43c1-a140-f2c10fce2fb4	215.000	g	\N
5a499e1a-d799-44e3-b4a4-a1210d4d35c0	a8ec8dd9-3bb1-4326-bcce-ef3b384538f4	14fbc8f8-26a5-4b7d-8f98-ea4cdb244da2	60.000	g	\N
ed431037-394d-46a1-8126-dc95cb6e638f	a8ec8dd9-3bb1-4326-bcce-ef3b384538f4	675363de-7da3-4e7f-9bcd-70950576cf75	40.000	g	\N
03b75dfb-9fda-46aa-a24c-bb3670dbb7c2	a8ec8dd9-3bb1-4326-bcce-ef3b384538f4	94ad247f-b541-4264-bbd2-c1d81d6ebf85	0.500	g	\N
e0b5dae1-21c4-4391-a419-b3a130b51e16	a8ec8dd9-3bb1-4326-bcce-ef3b384538f4	7b0fd27f-da99-4439-8768-07adc2f3d340	2.000	g	\N
f4be2789-07d9-4743-ad58-000f828b926f	a8ec8dd9-3bb1-4326-bcce-ef3b384538f4	7a1c7f57-aa63-4cab-9d14-d827e99ad580	2.500	g	\N
9613004a-9d87-417e-bde1-18115e290669	a8ec8dd9-3bb1-4326-bcce-ef3b384538f4	72bb18e1-a728-4768-b82d-0b78d6ceafbd	60.000	g	\N
1e54e8d4-99fc-4003-a654-f8d1f9f3a989	a8ec8dd9-3bb1-4326-bcce-ef3b384538f4	a05f5b1f-939d-4585-a60e-e9714b517ebe	80.000	g	\N
ba9eb118-511e-4770-b69a-b23f9acfa589	d099f0c2-15d1-47bc-a922-c3f7888ecab7	14fbc8f8-26a5-4b7d-8f98-ea4cdb244da2	180.000	g	\N
dd5963b0-f9aa-4776-81e1-0435a71e6ddf	46a99b4a-aeaa-40d8-824d-b6bf97f8fc94	bb6758c2-c205-4842-a868-a74241349346	120.000	g	\N
5928c830-ab13-47b4-a2f1-eca897ea3d25	46a99b4a-aeaa-40d8-824d-b6bf97f8fc94	142ac974-795d-43c1-a140-f2c10fce2fb4	300.000	g	\N
26d0ca3f-d233-49fb-b819-aaa292f063e5	46a99b4a-aeaa-40d8-824d-b6bf97f8fc94	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	100.000	g	\N
18b75738-5729-4d0b-b034-bd4276abf484	46a99b4a-aeaa-40d8-824d-b6bf97f8fc94	e7104e46-d788-45eb-b28f-bb778cb4309b	170.000	g	\N
90036eee-8130-4272-8a3e-801aa16df7e3	46a99b4a-aeaa-40d8-824d-b6bf97f8fc94	36b0c4dc-07df-46ad-a0f7-2d694a118fd8	5.000	g	\N
80bf02c9-7d43-41a1-88c5-05af89db013c	d099f0c2-15d1-47bc-a922-c3f7888ecab7	bb6758c2-c205-4842-a868-a74241349346	180.000	g	\N
96ab2d63-adb2-4542-b7d6-2b6c7fbeb9c7	d099f0c2-15d1-47bc-a922-c3f7888ecab7	142ac974-795d-43c1-a140-f2c10fce2fb4	360.000	g	\N
6d41845c-32e8-43e3-abe9-d46c37c63717	d099f0c2-15d1-47bc-a922-c3f7888ecab7	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	90.000	g	\N
9fa4b36f-50ed-42d8-985f-e3ac4ee0244b	d099f0c2-15d1-47bc-a922-c3f7888ecab7	e7104e46-d788-45eb-b28f-bb778cb4309b	180.000	g	\N
c84eebdf-9eaf-435f-9356-ca6c44bbc850	d099f0c2-15d1-47bc-a922-c3f7888ecab7	a05f5b1f-939d-4585-a60e-e9714b517ebe	360.000	g	\N
72fb1fbc-9f4a-4487-9d66-046148970aa0	d099f0c2-15d1-47bc-a922-c3f7888ecab7	7026a064-1ae3-4135-8793-769b623c5a19	180.000	g	\N
654999dc-a6c3-4050-8579-ed0da154f552	d099f0c2-15d1-47bc-a922-c3f7888ecab7	7a1c7f57-aa63-4cab-9d14-d827e99ad580	3.500	g	\N
e140bef7-bdf8-44ef-8e81-3566c182d9d7	331c71b3-1fa1-472c-883f-eaf1dc825172	72bb18e1-a728-4768-b82d-0b78d6ceafbd	80.000	g	\N
92cbcbbb-2e60-432b-9497-96d8e767667f	331c71b3-1fa1-472c-883f-eaf1dc825172	be1b6cef-c2a7-4c2b-bcc9-a28d9f3cc14e	100.000	g	\N
9462039b-b1d9-4e86-ac52-31af273c8296	331c71b3-1fa1-472c-883f-eaf1dc825172	0445a1bf-99f5-4a3d-9ce8-5452bfb8da36	100.000	g	\N
5ac5457c-61d3-469b-821d-73a860573033	d1ae9489-2332-4839-9e26-e971857de3cf	142ac974-795d-43c1-a140-f2c10fce2fb4	200.000	g	\N
5f18472e-6bf4-4c80-baa4-63990d4b664f	d1ae9489-2332-4839-9e26-e971857de3cf	14fbc8f8-26a5-4b7d-8f98-ea4cdb244da2	200.000	g	\N
6a2bf423-1925-45ce-a0dc-177bc7ceebd8	d1ae9489-2332-4839-9e26-e971857de3cf	f167b495-e81d-4026-aca6-277c6ad3a610	30.000	g	\N
f54522c3-5160-4905-a7cc-671415a2a445	d1ae9489-2332-4839-9e26-e971857de3cf	bb6758c2-c205-4842-a868-a74241349346	30.000	g	\N
b9cff7ec-3bc8-4ebb-a8c9-f7baa41cf09e	d1ae9489-2332-4839-9e26-e971857de3cf	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	65.000	g	\N
231a1472-cc56-4206-bce4-356fbe66caa0	d1ae9489-2332-4839-9e26-e971857de3cf	e7104e46-d788-45eb-b28f-bb778cb4309b	80.000	g	\N
7c2b1c46-923f-4463-9958-aa57e7e97edc	d1ae9489-2332-4839-9e26-e971857de3cf	c737c493-6149-42ee-89b1-69efb662601d	20.000	g	\N
b61fb261-459d-4dc3-b3a2-0257f9e7c894	d1ae9489-2332-4839-9e26-e971857de3cf	45594b4f-1123-46d7-b523-8431d123e64d	160.000	g	\N
144fedce-7423-400c-b2f1-99d4e457faf1	d1ae9489-2332-4839-9e26-e971857de3cf	6292d6bc-8e04-4934-96f8-096ff502b48d	50.000	g	\N
77c3d7f9-dcd4-4293-b5b6-9da2d93ce625	d1ae9489-2332-4839-9e26-e971857de3cf	7b0fd27f-da99-4439-8768-07adc2f3d340	3.000	g	\N
7b7529d1-ee52-4200-8a5d-90a6cb48c85b	331c71b3-1fa1-472c-883f-eaf1dc825172	7a1c7f57-aa63-4cab-9d14-d827e99ad580	1.000	g	\N
1ffdaf0d-54be-40dd-abcf-229616b5a9b1	331c71b3-1fa1-472c-883f-eaf1dc825172	23893ab7-24d1-48dc-a9d9-e6d6011d0f46	5.000	g	\N
22386137-48f7-4416-93fd-4d50e8163174	331c71b3-1fa1-472c-883f-eaf1dc825172	e538fe30-f3c8-4b0f-81d4-5ba8ad53cb20	2.500	g	\N
43062494-ffb0-4f87-aa41-ad8b5350018f	cef2c94c-c14f-4b4b-8d73-f131f87065be	142ac974-795d-43c1-a140-f2c10fce2fb4	325.000	g	\N
328748d1-d866-42d9-aad3-f643649404dc	cef2c94c-c14f-4b4b-8d73-f131f87065be	f167b495-e81d-4026-aca6-277c6ad3a610	70.000	g	\N
9ee1f2e2-6766-4943-951c-3a4e45efef53	cef2c94c-c14f-4b4b-8d73-f131f87065be	14fbc8f8-26a5-4b7d-8f98-ea4cdb244da2	175.000	g	\N
920d28f6-28e7-451b-959d-7db6df04b859	cef2c94c-c14f-4b4b-8d73-f131f87065be	b57e2a37-fdd4-4a1e-b59b-2aaacc331d06	100.000	g	\N
46ffb644-a7ae-4d6f-ae93-a9c99ff7ad62	cef2c94c-c14f-4b4b-8d73-f131f87065be	45594b4f-1123-46d7-b523-8431d123e64d	50.000	g	\N
3bf7ca85-7be4-41e1-ad3f-fa73f9a8b44c	cef2c94c-c14f-4b4b-8d73-f131f87065be	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	25.000	g	\N
47314511-57de-4f06-8756-31f46465506b	cef2c94c-c14f-4b4b-8d73-f131f87065be	f57a34ca-a5a1-43d7-94b6-8c5e140be225	2.000	g	\N
9889ed6e-292c-4205-b616-9c0c62168d3f	3440ede8-81d8-4495-8dd1-a940635a0cca	4117fd7d-cfd9-41af-b83c-d8e4dcaa13d1	65.000	g	\N
f5af56e1-697b-44b8-a940-14c4953e9d0b	3440ede8-81d8-4495-8dd1-a940635a0cca	72bb18e1-a728-4768-b82d-0b78d6ceafbd	58.000	g	\N
83c8d3d7-00c2-4c96-a55f-6642230c4885	3440ede8-81d8-4495-8dd1-a940635a0cca	32411ce9-9b99-4704-a09e-6980cb3e8880	140.000	g	\N
85a83841-95c3-4d7b-b16c-e311ea93db70	3440ede8-81d8-4495-8dd1-a940635a0cca	0445a1bf-99f5-4a3d-9ce8-5452bfb8da36	120.000	g	\N
661a08c9-1f38-445c-a77c-c16ae47197b6	3440ede8-81d8-4495-8dd1-a940635a0cca	7a1c7f57-aa63-4cab-9d14-d827e99ad580	3.500	g	\N
574ee8dd-3423-4541-8e49-1b97930ca957	3440ede8-81d8-4495-8dd1-a940635a0cca	6816d50e-462f-4741-8263-67fab059f846	14.000	g	\N
f2e82695-4a10-464e-912e-a480868e1559	3440ede8-81d8-4495-8dd1-a940635a0cca	881e2f7e-7dd0-4b2f-9c5d-51746e5f6db8	70.000	g	\N
3a74f8da-9662-4d26-bccd-54ed615ca9d9	39f3f627-527a-4317-b5b0-aa8aae07cee2	52d97950-2075-4107-bd53-d021cf65d894	1000.000	g	\N
531bd303-b901-4c4c-9f67-de9f2de3d8ce	39f3f627-527a-4317-b5b0-aa8aae07cee2	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	200.000	g	\N
aaee8b9d-6982-4d80-9ac6-2de9bffa6931	39f3f627-527a-4317-b5b0-aa8aae07cee2	52cd4949-8af4-4705-b8c9-1f897d7d08b8	50.000	g	\N
7016887f-05be-41be-a4ec-30b19db22480	39f3f627-527a-4317-b5b0-aa8aae07cee2	ee1b6b8c-e5c1-46f5-8d01-9ab87a2c7ede	10.000	g	\N
9494a457-cabc-4742-b565-922989f125ed	39f3f627-527a-4317-b5b0-aa8aae07cee2	9eeb3abb-80e3-4100-b052-577d662dd4ac	10.000	g	\N
102686dd-2efa-47a9-9812-8061e8dc2544	39f3f627-527a-4317-b5b0-aa8aae07cee2	3b9ac64b-f1b3-4f67-9161-6d834ef3d3d3	7.000	g	\N
e2fbbc57-ebd3-4421-b8c8-cae9663a2a0f	39f3f627-527a-4317-b5b0-aa8aae07cee2	f190de96-84bd-44bb-83fc-4b8b2ec8a307	4.000	g	\N
da2b4a85-4d48-498b-837d-cc143f45d960	ae50dca1-1aac-4b3d-b832-fc6e67a2435f	14fbc8f8-26a5-4b7d-8f98-ea4cdb244da2	450.000	g	\N
86588462-6a5a-40fb-bb5f-df15ab5ef00b	ae50dca1-1aac-4b3d-b832-fc6e67a2435f	142ac974-795d-43c1-a140-f2c10fce2fb4	115.000	g	\N
93648835-00a1-45c8-bd18-8cd16f3f8344	ae50dca1-1aac-4b3d-b832-fc6e67a2435f	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	160.000	g	\N
7d6cda5d-bf49-457d-8ecc-f0741e5e15ba	ae50dca1-1aac-4b3d-b832-fc6e67a2435f	ee1b6b8c-e5c1-46f5-8d01-9ab87a2c7ede	13.000	g	\N
47a6e899-664b-48d5-85a5-ab8fb968859c	ae50dca1-1aac-4b3d-b832-fc6e67a2435f	9d549928-0981-4553-8481-13718cb42be9	10.000	g	\N
bf71fc76-c540-4cfd-84bc-d6a30793edaf	ae50dca1-1aac-4b3d-b832-fc6e67a2435f	e7104e46-d788-45eb-b28f-bb778cb4309b	55.000	g	\N
a69c0966-3d9a-4fbb-9a51-ef78be63a7b8	ae50dca1-1aac-4b3d-b832-fc6e67a2435f	daea9244-f949-4d5f-a2b5-1fa20afd921a	100.000	g	\N
f9d4c83f-5c1a-45d0-8630-764319d91c7d	02da0056-26c6-4884-b0a2-edd9e99ef0fe	72bb18e1-a728-4768-b82d-0b78d6ceafbd	100.000	g	\N
174cab5e-00d9-4023-9bf2-edf9cfdbf1dd	02da0056-26c6-4884-b0a2-edd9e99ef0fe	6ac61d5f-ea36-42ba-a350-31b4f1b88cb7	100.000	g	\N
fac675a6-8794-4e08-935c-45a09226c993	02da0056-26c6-4884-b0a2-edd9e99ef0fe	30b1e950-c84a-48d8-9748-8c92ac81bc75	40.000	g	\N
a13f8cdb-5f0b-40ea-b86f-b8aa20f0696b	02da0056-26c6-4884-b0a2-edd9e99ef0fe	0445a1bf-99f5-4a3d-9ce8-5452bfb8da36	80.000	g	\N
5bfb47e9-3306-43fe-821d-fa8d29f6b88a	02da0056-26c6-4884-b0a2-edd9e99ef0fe	36b0c4dc-07df-46ad-a0f7-2d694a118fd8	20.000	g	\N
4a0746ab-a625-4770-a2f8-295e2029de39	02da0056-26c6-4884-b0a2-edd9e99ef0fe	be1b6cef-c2a7-4c2b-bcc9-a28d9f3cc14e	100.000	g	\N
12bfba6d-806d-4b1a-8bed-117645156f6b	02da0056-26c6-4884-b0a2-edd9e99ef0fe	7a1c7f57-aa63-4cab-9d14-d827e99ad580	2.000	g	\N
e3261bc7-61f8-4206-b137-20ea1fed0b85	b4c27b75-959b-4c4b-bf7a-b43ad2dfa9be	142ac974-795d-43c1-a140-f2c10fce2fb4	300.000	g	\N
40404417-bfde-4c98-8623-a4baf0ce0596	b4c27b75-959b-4c4b-bf7a-b43ad2dfa9be	49003e9a-4b5d-46f2-8dbf-fb1ab718430f	100.000	g	\N
1e769d80-2492-4a28-aec8-0b1aef9683f0	b4c27b75-959b-4c4b-bf7a-b43ad2dfa9be	7026a064-1ae3-4135-8793-769b623c5a19	50.000	g	\N
f2564e41-5511-4d91-a339-c798108fae83	b4c27b75-959b-4c4b-bf7a-b43ad2dfa9be	f190de96-84bd-44bb-83fc-4b8b2ec8a307	2.500	g	\N
bb680789-f87b-45d4-a10c-e776348a33a3	2d092257-86bf-407b-9cfc-32b7b7cf94dc	14fbc8f8-26a5-4b7d-8f98-ea4cdb244da2	1815.000	g	\N
76623a49-5cc1-4fd5-9389-118cc0d47f1d	2d092257-86bf-407b-9cfc-32b7b7cf94dc	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	272.000	g	\N
fc3188b8-e4db-4d00-b983-5112410b12be	2d092257-86bf-407b-9cfc-32b7b7cf94dc	9d68c217-549b-46c3-adc4-b334b1bda37e	290.000	g	\N
94077504-8c0f-438c-91dd-02f1ead7c278	2d092257-86bf-407b-9cfc-32b7b7cf94dc	0445a1bf-99f5-4a3d-9ce8-5452bfb8da36	1815.000	g	\N
634c8806-ab4c-421e-89fd-29cbce6a5302	2d092257-86bf-407b-9cfc-32b7b7cf94dc	e7104e46-d788-45eb-b28f-bb778cb4309b	1540.000	g	\N
5bffa54e-22d9-48a1-8aa7-53346bfe1559	2d092257-86bf-407b-9cfc-32b7b7cf94dc	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	308.000	g	\N
253a2dd0-e193-4df7-b758-54a81c8f0419	2d092257-86bf-407b-9cfc-32b7b7cf94dc	72bb18e1-a728-4768-b82d-0b78d6ceafbd	1540.000	g	\N
2871ea76-b322-4584-b7a6-8bcf4c20cd2e	2d092257-86bf-407b-9cfc-32b7b7cf94dc	0445a1bf-99f5-4a3d-9ce8-5452bfb8da36	4928.000	g	\N
8041016d-33d2-4a1a-9ad1-63a97ca06b5a	2d092257-86bf-407b-9cfc-32b7b7cf94dc	7a1c7f57-aa63-4cab-9d14-d827e99ad580	12.320	g	\N
8a1be5e5-1eac-4c57-beab-f4701d3b0ea9	2d092257-86bf-407b-9cfc-32b7b7cf94dc	14fbc8f8-26a5-4b7d-8f98-ea4cdb244da2	1540.000	g	\N
6734177a-782b-436a-b2d4-25024f15304c	c2b91acb-81f2-4422-b4be-ec4154e57373	4e37f79e-2f56-484b-869d-ad5c371e6d76	300.000	g	\N
556191e4-4e4c-43a6-999a-7f59737d1706	c2b91acb-81f2-4422-b4be-ec4154e57373	9d549928-0981-4553-8481-13718cb42be9	30.000	g	\N
e5483846-131b-4e9b-9773-ec5698db3bbc	c2b91acb-81f2-4422-b4be-ec4154e57373	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	80.000	g	\N
1ede5acb-8979-4232-85b6-fc7ee89ae7e4	c2b91acb-81f2-4422-b4be-ec4154e57373	4484bff8-561f-4bba-9220-374ff9987ae7	50.000	g	\N
aaa01c69-7a98-47e7-b10a-1de06f066b04	c2b91acb-81f2-4422-b4be-ec4154e57373	72bb18e1-a728-4768-b82d-0b78d6ceafbd	80.000	g	\N
b15fc431-8f7e-4784-a71e-e4aebe807118	5a9c40f7-6912-41e8-a900-be21f2b87de7	6faee840-e1a9-4551-8388-81e091749687	10.000	g	\N
1d97d2fc-073a-4472-b2ea-5bd10f204a2f	5a9c40f7-6912-41e8-a900-be21f2b87de7	123c658e-4cea-49f8-a391-85ca201925e2	90.000	g	\N
b4b27506-4165-4e20-9cfd-d86b40910bc8	5a9c40f7-6912-41e8-a900-be21f2b87de7	cbc5ec7e-4509-4486-8c51-6b6943a1a20c	100.000	g	\N
03ee1417-487f-4742-b034-929c8aa2ed86	5a9c40f7-6912-41e8-a900-be21f2b87de7	118cff31-fcb0-4d38-bb0d-5bbc5ea12145	100.000	g	\N
\.


--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.recipes (id, name, description, category_id, instructions, image_url, is_active, created_at, updated_at, allergens, is_vegan, is_gluten_free, is_lactose_free, total_yield_grams) FROM stdin;
211e512c-a599-44e5-9925-1ea94a120a1c	krem limonka biała czekolada	callebaut kamil szulc	2fa00540-95fb-42a2-b51e-c0412549d5a3	["zagotować purre z zestem i zalać wymieszane białko, cukier i jaja","gotować do 85*C","dodać żelatynę i zalac masą czekoladę","zblędować i przelać do formy"]	\N	t	2025-09-15 18:46:40.861343	2025-09-15 18:46:53.894	["Eggs","Milk","Soybeans"]	f	t	f	\N
e9bcd9ce-243a-48d7-acfd-dd1baa845fa3	baba cytrynbowa	baba alain ducas	83846e5b-530a-45be-94e9-48a23328873e	[]	\N	f	2025-09-10 15:16:58.92134	2025-09-10 15:16:58.92134	[]	f	f	f	\N
1fad514b-6d08-4054-a740-4ca51aebb80e	ciastko marcheqwkowe	ugabuga	493bc7dd-9f7c-41e5-9050-97e7fea350a5	[]	\N	f	2025-09-07 17:38:01.139981	2025-09-07 17:38:01.139981	[]	t	f	f	\N
331c71b3-1fa1-472c-883f-eaf1dc825172	ciastka kawowe	CH zielona	493bc7dd-9f7c-41e5-9050-97e7fea350a5	["wszystkie składniki wymieszać liściem ","piec w 160*C przez 30min","co 10 min przemieszać szpatułą"]	\N	t	2025-09-16 18:19:09.283303	2025-09-16 18:23:03.099	["Milk","Gluten"]	f	f	f	\N
c0211b65-d851-40f8-858d-398d16840c2e	ciasto drożdzowe	drożdzowe belve	493bc7dd-9f7c-41e5-9050-97e7fea350a5	[]	\N	f	2025-09-11 19:55:49.53404	2025-09-12 13:32:52.56	["Gluten","Celery","Nuts"]	t	f	t	\N
47a2a66d-b87e-417b-b9d2-085e9b0a8425	sernik	syry	\N	[]	\N	f	2025-09-07 17:56:05.076435	2025-09-07 17:56:05.076435	[]	f	f	f	\N
8a9fcad2-df28-46f6-8368-39705f781aef	baba cytrynowa	baba alain ducase	83846e5b-530a-45be-94e9-48a23328873e	[]	\N	f	2025-09-07 17:11:26.26411	2025-09-07 17:11:26.26411	[]	t	f	t	\N
46a99b4a-aeaa-40d8-824d-b6bf97f8fc94	lody kawowe paco	pako kawowowe	d82600be-6059-4c19-bad3-acc25b66b4f5	["ubić cukier, żółtka na puszystą masę. śmietankę espresso i kakao zagotować, dodać jaja i doprowadzić do 82*C","zamrozić w szoku","przekręcić w pako pod ="]	\N	t	2025-09-16 06:37:30.454772	2025-09-16 06:38:17.534	["Milk","Eggs"]	f	t	f	\N
9882b5ce-d7c5-443b-a9d1-a70d25f5d930	cookies orzech laskowy	cookies mazoviia\nWykonanie:\n1. masło z cukrem utrzeć.\n2. dodać jaja, pastę i rozpuszczoną czekoladę.\n3. dodać suche składniki i wszystko razem wymieszać\n4. odpiekać w 165*C	9ccf2855-b9a9-49c3-b8bc-03f753fcdb50	["masło utrzeć z cukrem","dodać jaja. pastę i rozpuszczoną czekoladę","dodać suche składniki i wszystko razem wymieszać","odpiekać w 165 stopniach"]	\N	t	2025-09-14 14:23:06.78119	2025-09-14 17:18:44.015	["Milk","Soybeans","Peanuts","Nuts","Eggs","Gluten"]	f	f	f	\N
d25a9448-3cad-4876-8561-07f299a2656f	Test Recipe with Instructions	This is a test recipe for cookies with instructions and ingredients.	9ccf2855-b9a9-49c3-b8bc-03f753fcdb50	["Mix ingredients","Knead dough","Bake at 180°C"]	\N	f	2025-09-14 17:44:49.634617	2025-09-14 20:29:27.957	["Gluten"]	t	f	t	1000.00
3ce0a257-cb35-4e1c-a1e8-7b8024f47fde	mus mango	CH zielona	3c87ee85-e754-45b2-a673-c00bc01bbf2f	["rozpuścić namoczoną żelatyne w 1/4 purre mango","połączyć z resztą purre i soku z limonki i trzymać w tem ok 26-28 stopni","podgrzać białka z cukrem i trehalozą do 60 stopni","ubić do soft peaks i odstawić do lodówki","gdy beza się ostudzi do 28 stopni dodac purre cienkim strumieniem","gdy całość się połączy wymieszać z podbitą śmietanką"]	\N	t	2025-09-15 18:10:24.958066	2025-09-15 18:22:26.054	["Eggs","Milk"]	f	t	f	\N
71c25c9d-2ff1-47ca-8d08-17678a61355c	kruszonka z różowym pieprzem	CH zielona	0d73cf48-1f56-465b-9563-f55fe2edae96	["zmiażdzyć pieprz w moździerzu","masło uplastycznić z cukrem","dodać suche składniki wymieszać i zamrozić w formie cylindrycznego batona","zamrożoną kruszonkę zmielić w maszynce do mięsa","odpiekać w 130*C przez 22min"]	\N	t	2025-09-15 18:09:50.738742	2025-09-15 18:23:51.939	["Milk","Gluten","Peanuts","Nuts"]	f	f	f	\N
e867ceb7-52f2-4a88-b190-7451cc753890	financier laskowy	my recipe	e25dd92c-9d79-4166-b752-c9d34ce3d198	["wszystkie suche składniki wymieszać razem","dodać pastę orzechową i białko i dokładnie połączyć ","dodać rozpuszczone masło i je wmieszać ","odpiekać w 170*C"]	\N	t	2025-09-15 18:31:09.431273	2025-09-15 18:31:25.379	["Nuts","Gluten","Eggs","Peanuts","Milk"]	f	f	f	\N
69a8a772-c39b-4226-a8a5-de78975bcb82	tiul z orzecha laskowego	kadra tiul	eb042bce-10da-4fe5-aaf6-d46cda135ea9	["mleko z glukozą, cukrem i pektyną zagotować.","dodać masło i jeszcze podgrzać ","zalać gorącą masą orzechy i nibsy","odstawić do schłodzenia ","odpiekać w 170*C"]	\N	t	2025-09-15 18:40:05.811292	2025-09-15 18:40:05.811292	["Milk","Gluten","Nuts"]	f	f	f	\N
d1ae9489-2332-4839-9e26-e971857de3cf	piana tiramisu	piana tiramisu gronda	3826528e-264c-4979-9a59-caafb80e5271	["śmietankę i mleko zainfuzować ziarnami kawy i odstawić na 30 min. ","z powstałego płynu utworzyć krem angielski i zalać pozostałe składniki ","dokładnie zblędować i przetrzeć przez drobne sito, wbić 2 naboje N2O"]	\N	t	2025-09-16 06:45:35.719603	2025-09-16 17:59:45.531	["Milk","Eggs","Gluten"]	f	f	f	\N
9413c47c-9afe-4348-9b9a-752e7be3e21d	cremoux czekolada z pieprzem	CH zielona	d3c3acc3-f453-4350-9049-5752a5fea1db	["zainfuzować zmłotkowany pieprz w mlekou przez 10min","zagotować infuzję i zalać żółtka, gotować do 84*C.","zalać rozpuszczone czekolady i emulgować","przy 35*C przelewać do form"]	\N	t	2025-09-16 18:04:16.494537	2025-09-16 18:04:16.494537	["Milk","Eggs"]	f	f	f	\N
a8ec8dd9-3bb1-4326-bcce-ef3b384538f4	karmel waniliowy	CH zielona	a8821cc0-034f-44d0-a86a-e12ed1a913bc	["1 cukier skarmelizować","zgasić karmel podgrzaną śmietanką i resztą składników oprócz masła i czekolady.","dodać masło z czekoladą i zemulgować"]	\N	t	2025-09-16 18:14:50.35362	2025-09-16 18:14:50.35362	["Milk","Gluten"]	f	f	f	\N
d099f0c2-15d1-47bc-a922-c3f7888ecab7	cremoux z orzechem laskowym, czekoladą i kawą	CH zielona	d3c3acc3-f453-4350-9049-5752a5fea1db	["śmietankę, mleko, cukier i kawę zagotować. ","wymieszać z żółtkami i zagotowac do 84*C","rozpuścić czekoladę z pastą orzechową i solą","połączyć obie masy i zemulgować"]	\N	t	2025-09-16 18:18:37.117409	2025-09-16 18:18:37.117409	["Milk","Eggs","Peanuts","Nuts"]	f	t	f	\N
cef2c94c-c14f-4b4b-8d73-f131f87065be	espuma kokos-kawa-mascarpone	CH zielona	3826528e-264c-4979-9a59-caafb80e5271	["ze śmietanki i kawy utworzyć infuzje","odważyć 175g infuzji.","płyny podgrzać do 40*C i dodać stabilizator wymieszany z cukrem","zagotować do 85*C","dodać mascarpone, zblędować i ochłodzić.","wbić naboje i przechowywać na płasko w lodówce"]	\N	t	2025-09-16 18:30:46.89775	2025-09-16 18:30:46.89775	["Milk","Eggs","Soybeans"]	f	t	f	\N
3440ede8-81d8-4495-8dd1-a940635a0cca	cookies pistacja -drobne	CH zielona	9ccf2855-b9a9-49c3-b8bc-03f753fcdb50	["zblędować mąkę z pistacjami.","wymieszać masło z pastą pistacjową i dodać mix mąki z PDP","następnie dodac białko ","uformować batona i zamrozić ","zmielić w maszynce do mięsa","piec przez 18 min w 160*C"]	\N	t	2025-09-21 09:33:05.512816	2025-09-21 09:33:05.512816	["Nuts","Milk","Gluten","Eggs"]	f	f	f	\N
39f3f627-527a-4317-b5b0-aa8aae07cee2	żel śliwkowy	żel śliwkowy LT	0a753f19-fb82-45e1-96d1-ba5bbe96875b	["skarmelizować cukier.","dodać pokrojone w kostkę śliwki i podzmażyć","dodać ocet i obie cytryny.","gotować do miękkości śliwki","zblędować, dodać agar i ponownie zagotować.","dodać namoczoną żelatynę i odstawić do stężenia"]	\N	t	2025-09-24 12:01:17.820593	2025-09-24 12:02:31.588	[]	f	t	t	\N
ae50dca1-1aac-4b3d-b832-fc6e67a2435f	lody maślanka cytryna	paco jet	d82600be-6059-4c19-bad3-acc25b66b4f5	["pasteryzowac mleko żółtka i cukier do 85*C i ostudzić","połączyć z pozostałymi skłandikami i zblędować","zamrozić i przekręcić pod normalnym ciśnieniem"]	\N	t	2025-09-24 12:10:00.430195	2025-09-24 12:10:00.430195	["Milk","Eggs"]	f	f	f	\N
02da0056-26c6-4884-b0a2-edd9e99ef0fe	crumble orzech laskowy czekolada	crumble LT	0d73cf48-1f56-465b-9563-f55fe2edae96	["wymieszać masło z cukrem ","dodać resztę suchych składników i posiekane orzechy laskowy","odpiekać w 160*C ok 15 min"]	\N	t	2025-09-24 12:13:05.986549	2025-09-24 12:14:15.645	["Milk","Peanuts","Nuts","Gluten"]	f	f	f	\N
b4c27b75-959b-4c4b-bf7a-b43ad2dfa9be	mus orzechowy	mus orzechowy kadra	3c87ee85-e754-45b2-a673-c00bc01bbf2f	["zagotować 30% śmietanki i zalać czekoladę, żelatynę i pastę","resztę śmietanki ubić na 3/4 i połączyć z poprzednią masą"]	\N	t	2025-09-24 17:26:40.457959	2025-09-24 17:26:40.457959	["Milk","Peanuts","Nuts"]	f	t	f	\N
2d092257-86bf-407b-9cfc-32b7b7cf94dc	ciasto na pączki	ciasto na pączki, bułki etc KP4	c8cd779f-a911-4281-a6e6-cdda9dbd5a50	["z pierwszych 4 składników utworzyć rozczyn.","wymieszać rozczyn z pozostałymi składnikami i zagnieść ciastko","smażyć w 165*C do złotego koloru"]	\N	t	2025-09-25 03:56:46.279624	2025-09-25 03:57:01.391	["Milk","Gluten","Eggs"]	f	f	f	\N
c2b91acb-81f2-4422-b4be-ec4154e57373	sos śliwkowy a'la crepe suzet	sos śliwkowy na kadre	9e73da0a-5129-4407-8088-3a42f49f9ea6	["skarmelizować cukier wraz z sokiem z cytryny","dodać purre śliwkowe i zredukować","dodać śliwowicę i ją odparować","zdjąć z ognia i dodać masło"]	\N	t	2025-09-25 04:09:53.257426	2025-09-25 04:39:05.845	["Milk"]	f	t	f	\N
5a9c40f7-6912-41e8-a900-be21f2b87de7	beza żurawinowa	beza żurawinowa kadra	edcffee2-22d9-4e6e-b008-3ccc5f1a41c5	["purre i albuminę dobrze zblędować","dodać cukier kryształ i ubijać na śrenich obrotach do rozpuszczenia cukru","na koniec dodać cukier puder i wymieszać","piec w 90*C"]	\N	t	2025-09-25 04:04:48.401675	2025-09-26 18:17:02.991	["Eggs"]	f	t	t	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password) FROM stdin;
\.


--
-- Name: categories categories_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_unique UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: ingredient_categories ingredient_categories_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ingredient_categories
    ADD CONSTRAINT ingredient_categories_name_unique UNIQUE (name);


--
-- Name: ingredient_categories ingredient_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ingredient_categories
    ADD CONSTRAINT ingredient_categories_pkey PRIMARY KEY (id);


--
-- Name: ingredients ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_pkey PRIMARY KEY (id);


--
-- Name: inventory_logs inventory_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_pkey PRIMARY KEY (id);


--
-- Name: production_plan_recipes production_plan_recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_plan_recipes
    ADD CONSTRAINT production_plan_recipes_pkey PRIMARY KEY (id);


--
-- Name: production_plans production_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_plans
    ADD CONSTRAINT production_plans_pkey PRIMARY KEY (id);


--
-- Name: recipe_ingredients recipe_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_pkey PRIMARY KEY (id);


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: ingredients ingredients_category_id_ingredient_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_category_id_ingredient_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.ingredient_categories(id);


--
-- Name: inventory_logs inventory_logs_ingredient_id_ingredients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_ingredient_id_ingredients_id_fk FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id);


--
-- Name: production_plan_recipes production_plan_recipes_plan_id_production_plans_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_plan_recipes
    ADD CONSTRAINT production_plan_recipes_plan_id_production_plans_id_fk FOREIGN KEY (plan_id) REFERENCES public.production_plans(id) ON DELETE CASCADE;


--
-- Name: production_plan_recipes production_plan_recipes_recipe_id_recipes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_plan_recipes
    ADD CONSTRAINT production_plan_recipes_recipe_id_recipes_id_fk FOREIGN KEY (recipe_id) REFERENCES public.recipes(id);


--
-- Name: recipe_ingredients recipe_ingredients_ingredient_id_ingredients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_ingredient_id_ingredients_id_fk FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id);


--
-- Name: recipe_ingredients recipe_ingredients_recipe_id_recipes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_recipe_id_recipes_id_fk FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;


--
-- Name: recipes recipes_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

