import React from 'react';
import { Link } from 'react-router-dom';
import { useRouteA11y } from '../hooks/useRouteA11y';
import { IconShield, IconArrowLeft, IconInfo } from '../components/Icons';

const secciones = [
  {
    titulo: 'Quiénes somos',
    texto: 'IncluTrabajo AI es una demostración funcional. El equipo del proyecto actúa como responsable del tratamiento de los datos de esta demostración.',
  },
  {
    titulo: 'Qué datos tratamos',
    texto: 'Datos de identificación y contacto (nombre, correo, ciudad y teléfono opcional), datos de perfil laboral (competencias, experiencia y preferencias) y datos de accesibilidad que decidas declarar. Estos últimos son datos sensibles y solo se tratan con tu autorización.',
  },
  {
    titulo: 'Para qué los usamos',
    texto: 'Crear y administrar tu cuenta, calcular coincidencias laborales, permitir postulaciones, mostrar el estado de tus procesos y enviarte notificaciones internas. No usamos tus datos para publicidad ni para decisiones automatizadas que produzcan efectos jurídicos sin revisión humana.',
  },
  {
    titulo: 'Con quién los compartimos',
    texto: 'Las empresas solo ven tus datos de accesibilidad si otorgaste el consentimiento. Tu teléfono no se comparte. No vendemos datos ni los transferimos a terceros ajenos al proyecto.',
  },
  {
    titulo: 'Cuánto tiempo los conservamos',
    texto: 'Durante la vigencia de la cuenta y el tiempo necesario para la demostración académica. Puedes solicitar la eliminación de tu cuenta y de tus datos escribiendo al equipo del proyecto.',
  },
  {
    titulo: 'Tus derechos',
    texto: 'Puedes conocer, actualizar, rectificar y suprimir tus datos, revocar la autorización de accesibilidad desde tu perfil y solicitar información sobre su tratamiento. También puedes presentar una consulta o reclamo ante la Superintendencia de Industria y Comercio.',
  },
  {
    titulo: 'Seguridad',
    texto: 'Las contraseñas se almacenan con hash, las sesiones usan cookies HttpOnly y las consultas a la base de datos son parametrizadas. Ningún sistema es completamente infalible; si detectas un incidente, repórtalo al equipo.',
  },
  {
    titulo: 'Contacto',
    texto: 'Para ejercer tus derechos o resolver dudas sobre privacidad, escribe al correo de contacto del equipo del proyecto. Responderemos en un plazo razonable.',
  },
];

export default function Privacy() {
  useRouteA11y('Política de privacidad');

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition rounded-full px-2 py-1 -ml-2"
      >
        <IconArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      <header className="space-y-3">
        <span className="eyebrow">Transparencia y datos personales</span>
        <h1 className="page-title" tabIndex={-1}>Política de privacidad</h1>
        <p className="page-subtitle">
          Versión de demostración académica. Explica qué datos tratamos, para qué y cómo puedes
          controlar su uso.
        </p>
      </header>

      <div className="alert alert-success items-start" role="note">
        <IconShield className="w-5 h-5 shrink-0" />
        <p>
          <strong>Dato sensible:</strong> tus necesidades de accesibilidad solo se comparten con
          empresas si marcas la autorización en tu perfil. Puedes desactivarla cuando quieras.
        </p>
      </div>

      <div className="card p-7 md:p-9 space-y-7">
        {secciones.map((seccion, indice) => (
          <section key={seccion.titulo} className="space-y-2" aria-labelledby={`privacidad-${indice}`}>
            <h2 id={`privacidad-${indice}`} className="text-lg font-bold text-slate-900">
              {indice + 1}. {seccion.titulo}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">{seccion.texto}</p>
          </section>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-2xl bg-white/70 ring-1 ring-slate-900/10 shadow-sm p-4 text-sm text-slate-600">
        <IconInfo className="w-5 h-5 shrink-0 text-violet-600 mt-0.5" />
        <p>
          Esta política aplica a la demo del proyecto. En una versión productiva se complementará con
          el aviso de privacidad, los canales de atención y los plazos formales exigidos por la
          normativa colombiana de protección de datos.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/registro" className="btn-primary">Crear cuenta</Link>
        <Link to="/login" className="btn-secondary">Volver al login</Link>
      </div>
    </div>
  );
}
