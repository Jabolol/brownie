/**
 * @file Google Analytics 4 reporting utility
 * @description This file is based on the original work from Deno's ga4 project.
 * For details, see: {@link https://github.com/denoland/ga4/blob/main/mod.ts}
 *
 * @modifications
 * - Removed deprecated interface `ConnInfo`
 * - Refactored `handler` to make it fresh-agnostic
 * - Only report `svg` files
 *
 * @license MIT The original work is licensed under the MIT License.
 * {@link https://github.com/denoland/ga4/blob/main/LICENSE.md}
 *
 * Additional terms:
 * © Jabolo 2023
 * Licensed under the terms of the MIT License.
 */
import { Event, GA4Report, isDocument, isServerError } from "ga4";

const GA4_MEASUREMENT_ID = Deno.env.get("GA4_MEASUREMENT_ID");

let showedMissingEnvWarning = false;

function ga4(
  request: Request,
  conn: Deno.ServeHandlerInfo,
  response: Response,
  _start: number,
  error?: unknown,
) {
  if (GA4_MEASUREMENT_ID === undefined) {
    if (!showedMissingEnvWarning) {
      showedMissingEnvWarning = true;
      console.warn(
        "GA4_MEASUREMENT_ID environment variable not set. Google Analytics reporting disabled.",
      );
    }
    return;
  }
  Promise.resolve().then(async () => {
    // We're tracking page views and file downloads. These are the only two
    // HTTP methods that _might_ be used.
    if (!/^(GET|POST)$/.test(request.method)) {
      return;
    }

    // If the visitor is using a web browser, only create events when we serve
    // a top level documents or download; skip assets like css, images, fonts.
    if (!isDocument(request, response) && error == null) {
      return;
    }

    let event: Event | null = null;
    const contentType = response.headers.get("content-type");
    if (/image\/svg\+xml/.test(contentType!)) {
      event = { name: "page_view", params: {} }; // Probably an old browser.
    }

    if (event == null && error == null) {
      return;
    }

    // If an exception was thrown, build a separate event to report it.
    let exceptionEvent;
    if (error != null) {
      exceptionEvent = {
        name: "exception",
        params: {
          description: String(error),
          fatal: isServerError(response),
        },
      };
    } else {
      exceptionEvent = undefined;
    }

    // Create basic report.
    const measurementId = GA4_MEASUREMENT_ID;
    // @ts-ignore GA4Report doesn't even use the localAddress parameter
    const report = new GA4Report({ measurementId, request, response, conn });

    // Override the default (page_view) event.
    report.event = event;

    // Add the exception event, if any.
    if (exceptionEvent != null) {
      report.events.push(exceptionEvent);
    }

    await report.send();
  }).catch((err) => {
    console.error(`Internal error: ${err}`);
  });
}

export function report(
  req: Request,
  resp: Response,
  conn: Deno.ServeHandlerInfo,
): Response {
  let err;
  let res: Response;
  const start = performance.now();
  try {
    const headers = new Headers(resp.headers);
    headers.set("ga4", "success");
    res = new Response(resp.body, { status: resp.status, headers });
    return res;
  } catch (e) {
    res = new Response("Internal Server Error", {
      status: 500,
    });
    err = e;
    throw e;
  } finally {
    ga4(
      req,
      conn,
      res!,
      start,
      err,
    );
  }
}
