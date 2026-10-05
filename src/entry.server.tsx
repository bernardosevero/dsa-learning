import { renderToReadableStream } from "react-dom/server";
import { ServerRouter, type EntryContext } from "react-router";

/**
 * Renders a page to HTML. There is no server at runtime: this runs only in the build, to prerender
 * public pages and the app shell, so it always waits for the whole page (no bot detection needed).
 */
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
): Promise<Response> {
  let statusCode = responseStatusCode;
  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: unknown) {
        statusCode = 500;
        console.error(error);
      },
    },
  );
  await body.allReady;
  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, { headers: responseHeaders, status: statusCode });
}
