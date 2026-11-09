import type { Route } from "./+types/privacidad";

export const meta: Route.MetaFunction = () => [{ title: "Privacidad y datos — IncluTrabajo IA" }];

const BLOQUES = [
  ["Quién trata tus datos", "IncluTrabajo IA, proyecto académico del curso Negocios Inclusivos de la Universidad Tecnológica de Bolívar (Cartagena). Contacto: datos@inclutrabajo.co."],
  ["Qué datos pedimos", "Tu nombre, correo, ciudad y, si quieres, teléfono; lo que sabes hacer y el empleo que buscas. Si tú decides contarlos, los ajustes que necesitas y tus respuestas sobre actividades. Estos dos últimos son datos sensibles (Ley 1581 de 2012)."],
  ["Para qué los usamos", "Para calcular y explicarte qué vacantes encajan contigo, y para que la empresa a la que te postulas vea tu candidatura. Nunca usamos tu edad, sexo, etnia, nacionalidad ni tu discapacidad para calcular el puntaje."],
  ["Lo que es opcional", "Contarnos tus ajustes, responder las preguntas sobre actividades y autorizar que las empresas vean tus ajustes. Puedes usar la plataforma sin nada de esto (Decreto 1377 de 2013)."],
  ["Lo que ven las empresas", "Tu nombre, correo, ciudad, experiencia, competencias y puntaje cuando te postulas. Tus ajustes, solo si lo autorizaste. Tu teléfono y tus respuestas sobre actividades, nunca."],
  ["Tus derechos", "Conocer, actualizar, corregir y borrar tus datos, revocar tu autorización desde tu perfil y quejarte ante la Superintendencia de Industria y Comercio. Escríbenos y respondemos en máximo 10 días hábiles."],
  ["Cómo los cuidamos", "Contraseñas cifradas con argon2id, sesión en cookie segura, conexión cifrada y servidores en una nube con acceso restringido. No vendemos ni compartimos tus datos con terceros."],
] as const;

export default function Privacidad() {
  return (
    <div className="contenedor py-8 md:py-12 grid gap-8 max-w-3xl">
      <div className="grid gap-3">
        <h1 className="titulo-pagina">Privacidad y tratamiento de datos</h1>
        <p className="subtitulo">Lo importante, en corto. Versión 2026-11.</p>
      </div>
      <ol className="grid gap-4" role="list">
        {BLOQUES.map(([t, d]) => (
          <li key={t} className="tarjeta grid gap-2">
            <h2 className="text-2xl">{t}</h2>
            <p className="text-lg">{d}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
