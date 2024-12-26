// routes/api/screenshots.ts
import { Handlers } from "$fresh/server.ts";

interface ScreenshotData {
  url: string;
  screenshot: string; // base64 string
}

export const handler: Handlers = {
  async POST(req) {
    try {
      const data: ScreenshotData = await req.json();
      
      // Convert base64 to image and save if needed
      const imageBytes = base64ToUint8Array(data.screenshot);
      
      // Save to filesystem or database
      await Deno.writeFile(`./static/screenshots/${Date.now()}.png`, imageBytes);

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

function base64ToUint8Array(base64String: string): Uint8Array {
  return Uint8Array.from(atob(base64String), (c) => c.charCodeAt(0));
}