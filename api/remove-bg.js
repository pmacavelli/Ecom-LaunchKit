export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS — only allow requests from your own domain
  const allowedOrigins = [
    'https://ecomlaunchkit.com.au',
    'https://www.ecomlaunchkit.com.au',
    'https://ecom-launch-kit.vercel.app',
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const apiKey = process.env.REMOVEBG_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Stream the incoming multipart body directly to remove.bg
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': req.headers['content-type'],
      },
      body,
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    // Stream the image result back to the browser
    const imageBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="removed-bg.png"');
    return res.status(200).send(Buffer.from(imageBuffer));

  } catch (err) {
    console.error('remove-bg error:', err);
    return res.status(500).json({ error: 'Background removal failed' });
  }
}
