export const config = {
  runtime: "nodejs18.x",
};

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiUrl = process.env.CHAT_API_URL;
  const apiToken = process.env.CHAT_API_TOKEN;

  if (!apiUrl || !apiToken) {
    console.error("Missing CHAT_API_URL or CHAT_API_TOKEN environment variable");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  try {
    // Re-build the FormData from the incoming request body
    // The frontend sends multipart/form-data, so we forward the raw body + headers
    const contentType = req.headers["content-type"] || "";

    const upstreamRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        // Forward the original content-type (multipart boundary included)
        "content-type": contentType,
        // Inject the secret Bearer token server-side — never visible to the browser
        authorization: `Bearer ${apiToken}`,
      },
      body: req, // Node 18 supports streaming the IncomingMessage directly
      // @ts-ignore — duplex required for streaming body in Node fetch
      duplex: "half",
    });

    const data = await upstreamRes.json();

    // Mirror the upstream status code back to the client
    return res.status(upstreamRes.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(502).json({ error: "Bad gateway — upstream request failed" });
  }
}
