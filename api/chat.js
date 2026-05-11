export const config = {
  api: {
    bodyParser: false, // Must be false — we need the raw multipart bytes
  },
};

/** Read the full request body into a Buffer */
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/**
 * Inject a plain-text field into an existing multipart/form-data body.
 * Inserts a new part just before the closing boundary.
 */
function injectFormField(rawBody, contentType, fieldName, fieldValue) {
  const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
  if (!boundaryMatch) throw new Error("No multipart boundary found in Content-Type");
  const boundary = boundaryMatch[1];

  const closingDelimiter = Buffer.from(`\r\n--${boundary}--`);
  const newPart = Buffer.from(
    `\r\n--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"\r\n\r\n${fieldValue}`
  );

  const closingIdx = rawBody.lastIndexOf(closingDelimiter);
  if (closingIdx === -1) throw new Error("Multipart closing boundary not found in body");

  return Buffer.concat([
    rawBody.slice(0, closingIdx),
    newPart,
    closingDelimiter,
  ]);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiUrl = process.env.CHAT_API_URL;
  const apiToken = process.env.CHAT_API_TOKEN;

  if (!apiUrl || !apiToken) {
    console.error("Missing CHAT_API_URL or CHAT_API_TOKEN");
    return res.status(500).json({ error: "Server misconfiguration — env vars not set" });
  }

  try {
    const contentType = req.headers["content-type"] || "";
    let body = await getRawBody(req);

    // Inject the secret token as a FormData field (upstream reads it from the body)
    body = injectFormField(body, contentType, "authorization", `Bearer ${apiToken}`);

    const upstream = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "content-type": contentType, // Keep original boundary intact
      },
      body,
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(502).json({ error: "Proxy failed", detail: err.message });
  }
}
