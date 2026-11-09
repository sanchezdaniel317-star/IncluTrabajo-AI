export function loader() {
  throw new Response("No encontrada", { status: 404 });
}

export default function NoEncontrada() {
  return null;
}
