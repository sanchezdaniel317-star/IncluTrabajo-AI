-- Datos de demostración (sintéticos). Contraseña de todas las cuentas: Demo2026!

insert into competencias (id, nombre, sinonimos) values
  (1,  'Atención al cliente',      '{servicio al cliente,atención al público,servicio}'),
  (2,  'Excel',                    '{hojas de cálculo,microsoft excel,tablas}'),
  (3,  'Gestión documental',       '{archivo,manejo de documentos}'),
  (4,  'Ventas',                   '{asesoría comercial,venta}'),
  (5,  'Logística',                '{despachos,distribución}'),
  (6,  'Bodega e inventarios',     '{almacén,inventario,bodega}'),
  (7,  'Programación web',         '{desarrollo web,frontend,react,html}'),
  (8,  'Inglés',                   '{english,idioma inglés}'),
  (9,  'Análisis de datos',        '{datos,power bi,estadística}'),
  (10, 'Soporte técnico',          '{mesa de ayuda,help desk}'),
  (11, 'Contabilidad',             '{contable,cuentas}'),
  (12, 'Digitación',               '{transcripción,captura de datos}'),
  (13, 'Cocina',                   '{auxiliar de cocina,preparación de alimentos}'),
  (14, 'Redes sociales',           '{community manager,contenido digital}'),
  (15, 'Diseño gráfico',           '{diseño,ilustración}'),
  (16, 'Recepción',                '{recepcionista,front desk}');

insert into ajustes (id, clave, nombre, descripcion, dominio, criterio) values
  (1,  'rampa',             'Rampa o acceso sin escalones',      'Se puede entrar al lugar de trabajo sin subir escalones.',                     'caminar',   'acceso'),
  (2,  'ascensor',          'Ascensor',                          'Ascensor que funciona y llega al piso del puesto.',                            'caminar',   'acceso'),
  (3,  'bano_accesible',    'Baño accesible',                    'Baño amplio, con barras de apoyo, para silla de ruedas.',                      'autocuidado', 'bano'),
  (4,  'puesto_adaptado',   'Mesa a la altura de silla de ruedas','Superficie de trabajo y espacio libre para las rodillas.',                     'caminar',   'mobiliario'),
  (5,  'lector_pantalla',   'Lector de pantalla',                'Los programas del puesto funcionan con lector de pantalla (NVDA, JAWS).',      'ver',       'digital'),
  (6,  'ampliacion',        'Ampliación y alto contraste',       'Pantalla con ampliación y alto contraste.',                                    'ver',       'digital'),
  (7,  'interprete_lsc',    'Intérprete de Lengua de Señas',     'Intérprete de Lengua de Señas Colombiana en entrevistas y reuniones clave.',   'oir',       'organizacional'),
  (8,  'subtitulos',        'Subtítulos y comunicación escrita', 'Reuniones, videos y capacitaciones con subtítulos o texto.',                    'oir',       'digital'),
  (9,  'lenguaje_sencillo', 'Instrucciones en lectura fácil',    'Tareas e instrucciones explicadas paso a paso y con palabras sencillas.',      'recordar',  'organizacional'),
  (10, 'horario_flexible',  'Horario flexible',                  'Hora de entrada y pausas ajustables a citas médicas o de cuidado.',            'recordar',  'organizacional'),
  (11, 'teletrabajo',       'Trabajo remoto',                    'Trabajar desde casa todo o parte del tiempo.',                                 'caminar',   'organizacional'),
  (12, 'ambiente_tranquilo','Lugar con poco ruido',              'Puesto alejado del ruido y con pocas interrupciones.',                         'recordar',  'ambiente');

insert into usuarios (id, rol, nombre, email, password_hash, es_demo) values
  (1, 'persona', 'Ana Torres',            'ana.torres@demo.co',      '$argon2id$v=19$m=65536,t=3,p=4$H+Qnh21Ad4Nd8JJwdk4DHA$SwVGI0LU8rW6ryUWOA3aZ3FPoEqjmsSSjtiK6nnBOO4', true),
  (2, 'persona', 'Carlos Gómez',          'carlos.gomez@demo.co',    '$argon2id$v=19$m=65536,t=3,p=4$H+Qnh21Ad4Nd8JJwdk4DHA$SwVGI0LU8rW6ryUWOA3aZ3FPoEqjmsSSjtiK6nnBOO4', true),
  (3, 'persona', 'Luz Marina Pérez',      'luz.perez@demo.co',       '$argon2id$v=19$m=65536,t=3,p=4$H+Qnh21Ad4Nd8JJwdk4DHA$SwVGI0LU8rW6ryUWOA3aZ3FPoEqjmsSSjtiK6nnBOO4', true),
  (4, 'persona', 'Andrés Felipe Ruiz',    'andres.ruiz@demo.co',     '$argon2id$v=19$m=65536,t=3,p=4$H+Qnh21Ad4Nd8JJwdk4DHA$SwVGI0LU8rW6ryUWOA3aZ3FPoEqjmsSSjtiK6nnBOO4', true),
  (5, 'empresa', 'TechIncluye S.A.S.',    'talento@techincluye.demo.co', '$argon2id$v=19$m=65536,t=3,p=4$H+Qnh21Ad4Nd8JJwdk4DHA$SwVGI0LU8rW6ryUWOA3aZ3FPoEqjmsSSjtiK6nnBOO4', true),
  (6, 'empresa', 'Comercial del Caribe S.A.S.', 'rrhh@comercialcaribe.demo.co', '$argon2id$v=19$m=65536,t=3,p=4$H+Qnh21Ad4Nd8JJwdk4DHA$SwVGI0LU8rW6ryUWOA3aZ3FPoEqjmsSSjtiK6nnBOO4', true),
  (7, 'empresa', 'Hotel Bahía Grande',    'personal@bahiagrande.demo.co', '$argon2id$v=19$m=65536,t=3,p=4$H+Qnh21Ad4Nd8JJwdk4DHA$SwVGI0LU8rW6ryUWOA3aZ3FPoEqjmsSSjtiK6nnBOO4', true);

insert into personas (usuario_id, ciudad, telefono, experiencia_anios, modalidad_pref, jornada_pref, salario_min, comparte_ajustes, comparte_desde, dominios) values
  (1, 'Cartagena',    '3001234567', 2, 'hibrido',    'completa',     1800000, true,  now(), '{"ver": 3}'),
  (2, 'Bogotá',       null,         4, 'remoto',     'completa',     2500000, true,  now(), '{"caminar": 3}'),
  (3, 'Cartagena',    null,         6, 'presencial', 'cualquiera',   1750905, false, null,  '{"oir": 4}'),
  (4, 'Barranquilla', null,         1, 'cualquiera', 'completa',     1750905, true,  now(), '{"recordar": 3}');

insert into persona_competencias (persona_id, competencia_id) values
  (1, 1), (1, 2), (1, 3),
  (2, 7), (2, 8), (2, 10),
  (3, 13), (3, 1), (3, 6),
  (4, 12), (4, 2), (4, 11);

insert into persona_ajustes (persona_id, ajuste_id, prioridad) values
  (1, 5, 3), (1, 10, 2),
  (2, 11, 3), (2, 1, 1),
  (3, 7, 3), (3, 8, 2),
  (4, 9, 2), (4, 12, 2);

insert into empresas (usuario_id, sector, ciudad, trabajadores, pcd_vinculadas) values
  (5, 'Tecnología y software',  'Cartagena',    140, 1),
  (6, 'Comercio al por menor',  'Barranquilla', 320, 2),
  (7, 'Hotelería y turismo',    'Cartagena',     85, 0);

insert into vacantes (id, empresa_id, cargo, descripcion, ciudad, modalidad, jornada, salario) values
  (1, 5, 'Auxiliar administrativo', 'Apoyo en gestión de documentos, atención telefónica y cruce de datos en Excel. Puesto con estación adaptada y programas compatibles con lector de pantalla.', 'Cartagena', 'hibrido', 'completa', 1900000),
  (2, 5, 'Desarrollador(a) junior frontend', 'Construcción de interfaces web accesibles con React. Equipo remoto, reuniones con subtítulos y documentación escrita.', 'Cartagena', 'remoto', 'completa', 3200000),
  (3, 5, 'Analista de datos junior', 'Preparación de reportes en Excel y Power BI para el área comercial. Trabajo remoto con dos reuniones semanales.', 'Cartagena', 'remoto', 'completa', 2800000),
  (4, 6, 'Asesor(a) de servicio al cliente', 'Atención de clientes en tienda y por teléfono. Turnos de medio tiempo con horario ajustable.', 'Barranquilla', 'presencial', 'medio_tiempo', 1100000),
  (5, 6, 'Auxiliar de bodega e inventarios', 'Recepción, conteo y ubicación de mercancía en bodega. Señalización visual de áreas y alarmas luminosas.', 'Barranquilla', 'presencial', 'completa', 1850000),
  (6, 6, 'Digitador(a)', 'Registro de facturas y pedidos en el sistema. Instrucciones paso a paso y lugar de trabajo silencioso.', 'Barranquilla', 'hibrido', 'completa', 1800000),
  (7, 7, 'Auxiliar de cocina', 'Preparación de alimentos y apoyo en la cocina del restaurante del hotel. Equipo con intérprete de Lengua de Señas.', 'Cartagena', 'presencial', 'completa', 1750905),
  (8, 7, 'Recepcionista bilingüe', 'Registro de huéspedes, reservas y atención en inglés y español. Mostrador a la altura de silla de ruedas.', 'Cartagena', 'presencial', 'completa', 2200000);

insert into vacante_competencias (vacante_id, competencia_id) values
  (1, 1), (1, 2), (1, 3),
  (2, 7), (2, 8),
  (3, 9), (3, 2), (3, 8),
  (4, 1), (4, 4),
  (5, 6), (5, 5),
  (6, 12), (6, 2),
  (7, 13), (7, 1),
  (8, 16), (8, 8), (8, 1);

insert into vacante_ajustes (vacante_id, ajuste_id, estado, evidencia, verificado_en, compromiso_en) values
  (1, 5,  'verificado', 'Prueba con NVDA en el puesto durante la visita técnica.', '2026-10-14', null),
  (1, 1,  'verificado', 'Rampa medida: 7,8 % de pendiente, con pasamanos.',        '2026-10-14', null),
  (1, 3,  'verificado', 'Baño con giro de 1,50 m y barras de apoyo.',              '2026-10-14', null),
  (1, 10, 'declarado',  null, null, null),
  (2, 11, 'verificado', 'Política de trabajo remoto firmada y revisada.',          '2026-10-20', null),
  (2, 5,  'verificado', 'Herramientas del equipo probadas con lector de pantalla.', '2026-10-20', null),
  (2, 8,  'declarado',  null, null, null),
  (3, 11, 'verificado', 'Política de trabajo remoto firmada y revisada.',          '2026-10-20', null),
  (3, 6,  'declarado',  null, null, null),
  (3, 10, 'declarado',  null, null, null),
  (4, 10, 'declarado',  null, null, null),
  (4, 3,  'declarado',  null, null, null),
  (5, 7,  'ajustable',  null, null, '2026-12-01'),
  (5, 8,  'declarado',  null, null, null),
  (5, 12, 'verificado', 'Medición de 58 dB(A) en el área de conteo.',              '2026-10-28', null),
  (6, 9,  'verificado', 'Manual de tareas en lectura fácil revisado por el equipo.', '2026-10-28', null),
  (6, 12, 'declarado',  null, null, null),
  (6, 10, 'verificado', 'Acuerdo de horario flexible incluido en el contrato.',    '2026-10-28', null),
  (7, 7,  'verificado', 'Intérprete de LSC contratado por el hotel.',              '2026-11-02', null),
  (7, 8,  'ajustable',  null, null, '2026-12-15'),
  (7, 1,  'declarado',  null, null, null),
  (8, 4,  'declarado',  null, null, null),
  (8, 1,  'verificado', 'Acceso principal a nivel, sin escalones.',                '2026-11-02', null),
  (8, 2,  'verificado', 'Ascensor operativo hasta el lobby.',                      '2026-11-02', null);

insert into vacante_iap (vacante_id, criterio, valor) values
  (1, 'acceso', 1), (1, 'bano', 1), (1, 'mobiliario', 0.5), (1, 'ambiente', 1), (1, 'senalizacion', 0.5), (1, 'digital', 1), (1, 'organizacional', 1),
  (2, 'acceso', 1), (2, 'bano', 0.5), (2, 'mobiliario', 1), (2, 'ambiente', 1), (2, 'senalizacion', 0.5), (2, 'digital', 1), (2, 'organizacional', 1),
  (5, 'acceso', 0.5), (5, 'bano', 0.5), (5, 'mobiliario', 0.5), (5, 'ambiente', 1), (5, 'senalizacion', 1), (5, 'digital', 0), (5, 'organizacional', 0.5),
  (6, 'acceso', 1), (6, 'bano', 0.5), (6, 'mobiliario', 1), (6, 'ambiente', 0.5), (6, 'senalizacion', 0.5), (6, 'digital', 0.5), (6, 'organizacional', 1),
  (7, 'acceso', 0.5), (7, 'bano', 0.5), (7, 'mobiliario', 0.5), (7, 'ambiente', 0.5), (7, 'senalizacion', 1), (7, 'digital', 0.5), (7, 'organizacional', 1),
  (8, 'acceso', 1), (8, 'bano', 1), (8, 'mobiliario', 0.5), (8, 'ambiente', 0.5), (8, 'senalizacion', 1), (8, 'digital', 0.5), (8, 'organizacional', 0.5);

insert into postulaciones (id, persona_id, vacante_id, estado, puntaje_inicial, retroalimentacion) values
  (1, 1, 1, 'en_revision', 96, 'Revisamos tu perfil. Te escribiremos esta semana para la entrevista.'),
  (2, 3, 7, 'entrevista',  92, 'Entrevista el jueves a las 9:00 a. m., con intérprete de Lengua de Señas.'),
  (3, 4, 6, 'postulada',   93, null);

insert into postulacion_eventos (postulacion_id, desde, hacia, comentario, por) values
  (1, null, 'postulada', null, 1),
  (1, 'postulada', 'en_revision', 'Revisamos tu perfil. Te escribiremos esta semana para la entrevista.', 5),
  (2, null, 'postulada', null, 3),
  (2, 'postulada', 'entrevista', 'Entrevista el jueves a las 9:00 a. m., con intérprete de Lengua de Señas.', 7),
  (3, null, 'postulada', null, 4);

insert into avisos (usuario_id, titulo, mensaje, url) values
  (1, 'Tu postulación avanzó', 'Auxiliar administrativo · TechIncluye S.A.S. ahora está en revisión.', '/persona/postulaciones'),
  (1, 'Nueva vacante que encaja contigo', 'Analista de datos junior en TechIncluye S.A.S. tiene trabajo remoto verificado.', '/vacantes/3'),
  (3, 'Te invitaron a entrevista', 'Auxiliar de cocina · Hotel Bahía Grande. Habrá intérprete de Lengua de Señas.', '/persona/postulaciones'),
  (5, 'Nueva postulación', 'Ana Torres se postuló a Auxiliar administrativo.', '/empresa/vacantes/1/candidaturas'),
  (6, 'Nueva postulación', 'Andrés Felipe Ruiz se postuló a Digitador(a).', '/empresa/vacantes/6/candidaturas');

select setval(pg_get_serial_sequence('usuarios', 'id'), (select max(id) from usuarios));
select setval(pg_get_serial_sequence('competencias', 'id'), (select max(id) from competencias));
select setval(pg_get_serial_sequence('ajustes', 'id'), (select max(id) from ajustes));
select setval(pg_get_serial_sequence('vacantes', 'id'), (select max(id) from vacantes));
select setval(pg_get_serial_sequence('postulaciones', 'id'), (select max(id) from postulaciones));
