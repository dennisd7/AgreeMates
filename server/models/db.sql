--
-- PostgreSQL database dump
--

-- Dumped from database version 9.3.4
-- Dumped by pg_dump version 9.3.4
-- Started on 2014-05-05 13:48:19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- TOC entry 2062 (class 1262 OID 12029)
-- Name: postgres; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE postgres WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'English_United States.1252' LC_CTYPE = 'English_United States.1252';

CREATE ROLE postgres SUPERUSER CREATEDB CREATEROLE LOGIN;

\connect postgres

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- TOC entry 2063 (class 1262 OID 12029)
-- Dependencies: 2062
-- Name: postgres; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON DATABASE postgres IS 'default administrative connection database';


--
-- TOC entry 192 (class 3079 OID 11750)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 2065 (class 0 OID 0)
-- Dependencies: 192
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- TOC entry 191 (class 3079 OID 16384)
-- Name: adminpack; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS adminpack WITH SCHEMA pg_catalog;


--
-- TOC entry 2066 (class 0 OID 0)
-- Dependencies: 191
-- Name: EXTENSION adminpack; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION adminpack IS 'administrative functions for PostgreSQL';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 171 (class 1259 OID 25135)
-- Name: apartments; Type: TABLE; Schema: public; Owner: -; Tablespace:
--

CREATE TABLE apartments (
    id integer NOT NULL,
    name character varying(255),
    address character varying(255) NOT NULL
);


--
-- TOC entry 170 (class 1259 OID 25133)
-- Name: apartments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE apartments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2067 (class 0 OID 0)
-- Dependencies: 170
-- Name: apartments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE apartments_id_seq OWNED BY apartments.id;


--
-- TOC entry 185 (class 1259 OID 25310)
-- Name: bills; Type: TABLE; Schema: public; Owner: -; Tablespace:
--

CREATE TABLE bills (
    id integer NOT NULL,
    name character varying(255),
    createdate timestamp,
    duedate date,
    "interval" integer,
    paid boolean,
    amount numeric,
    reocurring_id integer NOT NULL,
    user_id integer,
    apartment_id integer
);


--
-- TOC entry 183 (class 1259 OID 25306)
-- Name: bills_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE bills_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2068 (class 0 OID 0)
-- Dependencies: 183
-- Name: bills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE bills_id_seq OWNED BY bills.id;


--
-- TOC entry 184 (class 1259 OID 25308)
-- Name: bills_reocurring_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE bills_reocurring_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2069 (class 0 OID 0)
-- Dependencies: 184
-- Name: bills_reocurring_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE bills_reocurring_id_seq OWNED BY bills.reocurring_id;


--
-- TOC entry 182 (class 1259 OID 25289)
-- Name: chores; Type: TABLE; Schema: public; Owner: -; Tablespace:
--

CREATE TABLE chores (
    id integer NOT NULL,
    name character varying(255),
    createdate timestamp,
    duedate date,
    "interval" integer,
    completed boolean,
    reocurring_id integer NOT NULL,
    user_id integer,
    apartment_id integer
);


--
-- TOC entry 180 (class 1259 OID 25285)
-- Name: chores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE chores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2071 (class 0 OID 0)
-- Dependencies: 180
-- Name: chores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE chores_id_seq OWNED BY chores.id;


--
-- TOC entry 181 (class 1259 OID 25287)
-- Name: chores_reocurring_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE chores_reocurring_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2072 (class 0 OID 0)
-- Dependencies: 181
-- Name: chores_reocurring_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE chores_reocurring_id_seq OWNED BY chores.reocurring_id;


--
-- TOC entry 179 (class 1259 OID 25266)
-- Name: comments; Type: TABLE; Schema: public; Owner: -; Tablespace:
--

CREATE TABLE comments (
    id integer NOT NULL,
    body text,
    date timestamp,
    user_id integer,
    message_id integer
);


--
-- TOC entry 178 (class 1259 OID 25264)
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2073 (class 0 OID 0)
-- Dependencies: 178
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE comments_id_seq OWNED BY comments.id;


--
-- TOC entry 177 (class 1259 OID 25245)
-- Name: messages; Type: TABLE; Schema: public; Owner: -; Tablespace:
--

CREATE TABLE messages (
    id integer NOT NULL,
    subject character varying(255),
    body text,
    date timestamp,
    user_id integer,
    apartment_id integer
);


--
-- TOC entry 176 (class 1259 OID 25243)
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2074 (class 0 OID 0)
-- Dependencies: 176
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE messages_id_seq OWNED BY messages.id;


--
-- TOC entry 187 (class 1259 OID 25332)
-- Name: payments; Type: TABLE; Schema: public; Owner: -; Tablespace:
--

CREATE TABLE payments (
    id integer NOT NULL,
    paid boolean,
    amount numeric,
    user_id integer,
    bill_id integer
);


--
-- TOC entry 186 (class 1259 OID 25330)
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2075 (class 0 OID 0)
-- Dependencies: 186
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE payments_id_seq OWNED BY payments.id;


--
-- TOC entry 173 (class 1259 OID 25146)
-- Name: supplies; Type: TABLE; Schema: public; Owner: -; Tablespace:
--

CREATE TABLE supplies (
    id integer NOT NULL,
    apartment_id integer,
    name character varying(255),
    status smallint
);


--
-- TOC entry 172 (class 1259 OID 25144)
-- Name: supplies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE supplies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2076 (class 0 OID 0)
-- Dependencies: 172
-- Name: supplies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE supplies_id_seq OWNED BY supplies.id;


--
-- TOC entry 175 (class 1259 OID 25219)
-- Name: users; Type: TABLE; Schema: public; Owner: -; Tablespace:
--

CREATE TABLE users (
    id integer NOT NULL,
    google_id character varying(21),
    facebook_id character varying(21),
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone integer,
    apartment_id integer,
    google_token character varying(255),
    facebook_token character varying(255)
);


--
-- TOC entry 188 (class 1259 OID 25360)
-- Name: users_chores; Type: TABLE; Schema: public; Owner: -; Tablespace:
--

CREATE TABLE users_chores (
	user_id integer,
    chore_id integer,
	id integer,
	order_index integer
);


--
-- TOC entry 174 (class 1259 OID 25217)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2077 (class 0 OID 0)
-- Dependencies: 174
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE users_id_seq OWNED BY users.id;


--
-- TOC entry 1886 (class 2604 OID 25408)
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY apartments ALTER COLUMN id SET DEFAULT nextval('apartments_id_seq'::regclass);


--
-- TOC entry 1893 (class 2604 OID 25409)
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY bills ALTER COLUMN id SET DEFAULT nextval('bills_id_seq'::regclass);


--
-- TOC entry 1894 (class 2604 OID 25410)
-- Name: reocurring_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY bills ALTER COLUMN reocurring_id SET DEFAULT nextval('bills_reocurring_id_seq'::regclass);

--
-- TOC entry 1891 (class 2604 OID 25412)
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY chores ALTER COLUMN id SET DEFAULT nextval('chores_id_seq'::regclass);


--
-- TOC entry 1892 (class 2604 OID 25413)
-- Name: reocurring_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY chores ALTER COLUMN reocurring_id SET DEFAULT nextval('chores_reocurring_id_seq'::regclass);


--
-- TOC entry 1890 (class 2604 OID 25414)
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY comments ALTER COLUMN id SET DEFAULT nextval('comments_id_seq'::regclass);


--
-- TOC entry 1889 (class 2604 OID 25415)
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY messages ALTER COLUMN id SET DEFAULT nextval('messages_id_seq'::regclass);


--
-- TOC entry 1895 (class 2604 OID 25416)
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY payments ALTER COLUMN id SET DEFAULT nextval('payments_id_seq'::regclass);


--
-- TOC entry 1887 (class 2604 OID 25417)
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY supplies ALTER COLUMN id SET DEFAULT nextval('supplies_id_seq'::regclass);


--
-- TOC entry 1888 (class 2604 OID 25418)
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- TOC entry 2038 (class 0 OID 25135)
-- Dependencies: 171
-- Data for Name: apartments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY apartments (id, name, address) FROM stdin;
1   test ap 1   test address
\.


--
-- TOC entry 2078 (class 0 OID 0)
-- Dependencies: 170
-- Name: apartments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('apartments_id_seq', 1, true);


--
-- TOC entry 2052 (class 0 OID 25310)
-- Dependencies: 185
-- Data for Name: bills; Type: TABLE DATA; Schema: public; Owner: -
--

COPY bills (id, name, createdate, duedate, "interval", paid, amount, reocurring_id, user_id, apartment_id) FROM stdin;
\.


--
-- TOC entry 2079 (class 0 OID 0)
-- Dependencies: 183
-- Name: bills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('bills_id_seq', 1, false);


--
-- TOC entry 2080 (class 0 OID 0)
-- Dependencies: 184
-- Name: bills_reocurring_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('bills_reocurring_id_seq', 1, false);


--
-- TOC entry 2049 (class 0 OID 25289)
-- Dependencies: 182
-- Data for Name: chores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY chores (id, name, createdate, duedate, "interval", completed, reocurring_id, user_id, apartment_id) FROM stdin;
\.


--
-- TOC entry 2082 (class 0 OID 0)
-- Dependencies: 180
-- Name: chores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('chores_id_seq', 1, false);


--
-- TOC entry 2083 (class 0 OID 0)
-- Dependencies: 181
-- Name: chores_reocurring_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('chores_reocurring_id_seq', 1, false);


--
-- TOC entry 2046 (class 0 OID 25266)
-- Dependencies: 179
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY comments (id, body, date, user_id, message_id) FROM stdin;
\.


--
-- TOC entry 2084 (class 0 OID 0)
-- Dependencies: 178
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('comments_id_seq', 1, false);


--
-- TOC entry 2085 (class 0 OID 0)
-- Dependencies: 176
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('messages_id_seq', 2, true);


--
-- TOC entry 2054 (class 0 OID 25332)
-- Dependencies: 187
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY payments (id, paid, amount, user_id, bill_id) FROM stdin;
\.


--
-- TOC entry 2086 (class 0 OID 0)
-- Dependencies: 186
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('payments_id_seq', 1, false);


--
-- TOC entry 2040 (class 0 OID 25146)
-- Dependencies: 173
-- Data for Name: supplies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY supplies (id, apartment_id, name, status) FROM stdin;
1   1   toilet paper    0
\.


--
-- TOC entry 2087 (class 0 OID 0)
-- Dependencies: 172
-- Name: supplies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('supplies_id_seq', 1, true);


--
-- TOC entry 2042 (class 0 OID 25219)
-- Dependencies: 175
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY users (id, google_id, facebook_id, first_name, last_name, email, phone, apartment_id, google_token, facebook_token) FROM stdin;
1   \N  \N  adf asdf    adf 1111    1   \N  \N
2   \N  \N  adf asdf    adf 1111    1   \N  \N
\.


--
-- TOC entry 2055 (class 0 OID 25360)
-- Dependencies: 188
-- Data for Name: users_chores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY users_chores (user_id, chore_id) FROM stdin;
\.


--
-- TOC entry 2088 (class 0 OID 0)
-- Dependencies: 174
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('users_id_seq', 2, true);


--
-- TOC entry 1898 (class 2606 OID 25143)
-- Name: apartments_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace:
--

ALTER TABLE ONLY apartments
    ADD CONSTRAINT apartments_pkey PRIMARY KEY (id);


--
-- TOC entry 1910 (class 2606 OID 25319)
-- Name: bills_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace:
--

ALTER TABLE ONLY bills
    ADD CONSTRAINT bills_pkey PRIMARY KEY (id);


--
-- TOC entry 1908 (class 2606 OID 25295)
-- Name: chores_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace:
--

ALTER TABLE ONLY chores
    ADD CONSTRAINT chores_pkey PRIMARY KEY (id);


--
-- TOC entry 1906 (class 2606 OID 25274)
-- Name: comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace:
--

ALTER TABLE ONLY comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- TOC entry 1904 (class 2606 OID 25253)
-- Name: messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace:
--

ALTER TABLE ONLY messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 1912 (class 2606 OID 25340)
-- Name: payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace:
--

ALTER TABLE ONLY payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 1900 (class 2606 OID 25151)
-- Name: supplies_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace:
--

ALTER TABLE ONLY supplies
    ADD CONSTRAINT supplies_pkey PRIMARY KEY (id);


--
-- TOC entry 1902 (class 2606 OID 25227)
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace:
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 1924 (class 2606 OID 25325)
-- Name: bills_apartment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY bills
    ADD CONSTRAINT bills_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES apartments(id);


--
-- TOC entry 1923 (class 2606 OID 25320)
-- Name: bills_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY bills
    ADD CONSTRAINT bills_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- TOC entry 1922 (class 2606 OID 25301)
-- Name: chores_apartment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY chores
    ADD CONSTRAINT chores_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES apartments(id);


--
-- TOC entry 1921 (class 2606 OID 25296)
-- Name: chores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY chores
    ADD CONSTRAINT chores_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- TOC entry 1920 (class 2606 OID 25280)
-- Name: comments_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY comments
    ADD CONSTRAINT comments_message_id_fkey FOREIGN KEY (message_id) REFERENCES messages(id);


--
-- TOC entry 1919 (class 2606 OID 25275)
-- Name: comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- TOC entry 1918 (class 2606 OID 25393)
-- Name: messages_apartment_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY messages
    ADD CONSTRAINT messages_apartment_id FOREIGN KEY (apartment_id) REFERENCES apartments(id);


--
-- TOC entry 1917 (class 2606 OID 25254)
-- Name: messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY messages
    ADD CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- TOC entry 1926 (class 2606 OID 25346)
-- Name: payments_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY payments
    ADD CONSTRAINT payments_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES bills(id);


--
-- TOC entry 1925 (class 2606 OID 25341)
-- Name: payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- TOC entry 1915 (class 2606 OID 25152)
-- Name: supplies_apartment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY supplies
    ADD CONSTRAINT supplies_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES apartments(id);


--
-- TOC entry 1916 (class 2606 OID 25228)
-- Name: users_apartment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES apartments(id);


--
-- TOC entry 1928 (class 2606 OID 25368)
-- Name: users_chores_chore_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY users_chores
    ADD CONSTRAINT users_chores_chore_id_fkey FOREIGN KEY (chore_id) REFERENCES chores(id);


--
-- TOC entry 1927 (class 2606 OID 25363)
-- Name: users_chores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY users_chores
    ADD CONSTRAINT users_chores_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


---invitation tables

CREATE TABLE invitations (
  id integer NOT NULL,
  email character varying(255) NOT NULL,
  apartment_id integer NOT NULL
);

CREATE SEQUENCE invitations_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

ALTER SEQUENCE invitations_id_seq OWNED BY invitations.id;

ALTER TABLE ONLY invitations
  ALTER COLUMN id SET DEFAULT nextval('invitations_id_seq'::regclass);

ALTER TABLE ONLY invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);

--history tables

CREATE TABLE history (
  id integer NOT NULL,
  date timestamp NOT NULL,
  history_string character varying(255) NOT NULL,
  apartment_id integer NOT NULL
);


CREATE SEQUENCE history_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

ALTER SEQUENCE history_id_seq OWNED BY history.id;

ALTER TABLE ONLY history
  ALTER COLUMN id SET DEFAULT nextval('history_id_seq'::regclass);

ALTER TABLE ONLY history
    ADD CONSTRAINT history_pkey PRIMARY KEY (id);