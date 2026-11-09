-- IncluTrabajo IA · esquema base (PostgreSQL 15+ y PGlite)

create table usuarios (
  id            serial primary key,
  rol           text not null check (rol in ('persona', 'empresa', 'tecnico')),
  nombre        text not null check (char_length(nombre) between 2 and 150),
  email         text not null unique check (char_length(email) <= 200),
  password_hash text not null,
  es_demo       boolean not null default false,
  creado_en     timestamptz not null default now()
);

create table personas (
  usuario_id        int primary key references usuarios(id) on delete cascade,
  ciudad            text not null,
  telefono          text,
  experiencia_anios int not null default 0 check (experiencia_anios between 0 and 70),
  modalidad_pref    text not null default 'cualquiera' check (modalidad_pref in ('presencial', 'hibrido', 'remoto', 'cualquiera')),
  jornada_pref      text not null default 'cualquiera' check (jornada_pref in ('completa', 'medio_tiempo', 'cualquiera')),
  salario_min       int not null default 0 check (salario_min >= 0),
  -- Autorización opcional y revocable para mostrar los ajustes a las empresas (Ley 1581 de 2012).
  comparte_ajustes  boolean not null default false,
  comparte_desde    timestamptz,
  -- Autoevaluación funcional opcional (Grupo de Washington): {"ver": 1..4, ...}. Nunca entra al puntaje.
  dominios          jsonb not null default '{}'::jsonb
);

create table empresas (
  usuario_id     int primary key references usuarios(id) on delete cascade,
  sector         text not null,
  ciudad         text not null,
  trabajadores   int not null default 0 check (trabajadores >= 0),
  pcd_vinculadas int not null default 0 check (pcd_vinculadas >= 0)
);

create table competencias (
  id        serial primary key,
  nombre    text not null unique,
  sinonimos text[] not null default '{}'
);

create table ajustes (
  id          serial primary key,
  clave       text not null unique,
  nombre      text not null,
  descripcion text not null,
  dominio     text not null,
  criterio    text not null
);

create table persona_competencias (
  persona_id     int not null references personas(usuario_id) on delete cascade,
  competencia_id int not null references competencias(id) on delete cascade,
  primary key (persona_id, competencia_id)
);

create table persona_ajustes (
  persona_id int not null references personas(usuario_id) on delete cascade,
  ajuste_id  int not null references ajustes(id) on delete cascade,
  prioridad  smallint not null check (prioridad between 1 and 3), -- 1 deseable, 2 importante, 3 esencial
  primary key (persona_id, ajuste_id)
);

create table vacantes (
  id             serial primary key,
  empresa_id     int not null references empresas(usuario_id) on delete cascade,
  cargo          text not null check (char_length(cargo) between 3 and 150),
  descripcion    text not null check (char_length(descripcion) between 10 and 4000),
  ciudad         text not null,
  modalidad      text not null check (modalidad in ('presencial', 'hibrido', 'remoto')),
  jornada        text not null check (jornada in ('completa', 'medio_tiempo')),
  salario        int not null check (salario > 0),
  activa         boolean not null default true,
  creada_en      timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

create table vacante_competencias (
  vacante_id     int not null references vacantes(id) on delete cascade,
  competencia_id int not null references competencias(id) on delete cascade,
  primary key (vacante_id, competencia_id)
);

create table vacante_ajustes (
  vacante_id    int not null references vacantes(id) on delete cascade,
  ajuste_id     int not null references ajustes(id) on delete cascade,
  estado        text not null check (estado in ('declarado', 'ajustable', 'verificado')),
  evidencia     text,
  verificado_en date,
  compromiso_en date,
  primary key (vacante_id, ajuste_id)
);

-- Índice de Accesibilidad del Puesto: un valor 0, 0.5 o 1 por criterio.
create table vacante_iap (
  vacante_id int not null references vacantes(id) on delete cascade,
  criterio   text not null check (criterio in ('acceso', 'bano', 'mobiliario', 'ambiente', 'senalizacion', 'digital', 'organizacional')),
  valor      numeric(2, 1) not null check (valor in (0, 0.5, 1)),
  primary key (vacante_id, criterio)
);

create table postulaciones (
  id                serial primary key,
  persona_id        int not null references personas(usuario_id) on delete cascade,
  vacante_id        int not null references vacantes(id) on delete cascade,
  estado            text not null default 'postulada'
                    check (estado in ('postulada', 'en_revision', 'entrevista', 'contratada', 'no_seleccionada', 'retirada')),
  puntaje_inicial   int not null,
  retroalimentacion text,
  creada_en         timestamptz not null default now(),
  actualizada_en    timestamptz not null default now(),
  unique (persona_id, vacante_id)
);

create table postulacion_eventos (
  id             serial primary key,
  postulacion_id int not null references postulaciones(id) on delete cascade,
  desde          text,
  hacia          text not null,
  comentario     text,
  por            int references usuarios(id) on delete set null,
  creado_en      timestamptz not null default now()
);

create table avisos (
  id         serial primary key,
  usuario_id int not null references usuarios(id) on delete cascade,
  titulo     text not null,
  mensaje    text not null,
  url        text,
  leido      boolean not null default false,
  creado_en  timestamptz not null default now()
);

create index vacantes_activas_idx on vacantes (activa, ciudad, modalidad);
create index postulaciones_vacante_idx on postulaciones (vacante_id);
create index eventos_postulacion_idx on postulacion_eventos (postulacion_id);
create index avisos_usuario_idx on avisos (usuario_id, leido);
