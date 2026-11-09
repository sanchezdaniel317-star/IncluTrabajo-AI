import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter, type EntryContext } from "react-router";

export const streamTimeout = 5_000;

function cabecerasDeSeguridad(h: Headers) {
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("X-Frame-Options", "DENY");
  // El micrófono se permite solo aquí, para el dictado por voz.
  h.set("Permissions-Policy", "camera=(), geolocation=(), microphone=(self), payment=()");
  h.set("Cross-Origin-Opener-Policy", "same-origin");
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  return new Promise<Response>((resolve, reject) => {
    let shellRendered = false;
    const userAgent = request.headers.get("user-agent");
    const listo = (userAgent && isbot(userAgent)) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(() => abort(), streamTimeout + 1000);

    const { pipe, abort } = renderToPipeableStream(<ServerRouter context={routerContext} url={request.url} />, {
      [listo]() {
        shellRendered = true;
        const body = new PassThrough({
          final(callback) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
            callback();
          },
        });
        const stream = createReadableStreamFromReadable(body);
        responseHeaders.set("Content-Type", "text/html; charset=utf-8");
        cabecerasDeSeguridad(responseHeaders);
        pipe(body);
        resolve(new Response(stream, { headers: responseHeaders, status: responseStatusCode }));
      },
      onShellError(error: unknown) {
        reject(error);
      },
      onError(error: unknown) {
        responseStatusCode = 500;
        if (shellRendered) console.error(error);
      },
    });
  });
}
