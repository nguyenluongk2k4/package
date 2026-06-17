const FPT_TTS_URL = "https://api.fpt.ai/hmi/tts/v5";
const MAX_TEXT_LENGTH = 5000;
const READY_CHECK_ATTEMPTS = 20;
const READY_CHECK_DELAY_MS = 1000;

export const runtime = "nodejs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getReadyAudio(url) {
  for (let attempt = 0; attempt < READY_CHECK_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });
      const contentType = response.headers.get("content-type") || "";
      const bytes = Buffer.from(await response.arrayBuffer());
      const looksLikeMp3 = bytes[0] === 0x49 || bytes[0] === 0xff;

      if (response.ok && looksLikeMp3) {
        return {
          bytes,
          contentType: contentType.toLowerCase().startsWith("audio/") ? contentType : "audio/mpeg",
        };
      }
    } catch {
      // FPT async files may need a few seconds before they are reachable.
    }

    await sleep(READY_CHECK_DELAY_MS);
  }

  return null;
}

function isAllowedAudioUrl(src) {
  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      (url.hostname.endsWith("amazonaws.com") || url.hostname.endsWith("fpt.ai"))
    );
  } catch {
    return false;
  }
}

export async function GET(request) {
  const src = new URL(request.url).searchParams.get("src");

  if (!src || !isAllowedAudioUrl(src)) {
    return Response.json({ error: "Invalid audio source." }, { status: 400 });
  }

  const audioResponse = await fetch(src, { cache: "no-store" });
  const contentType = audioResponse.headers.get("content-type") || "audio/mpeg";

  if (!audioResponse.ok || !contentType.toLowerCase().startsWith("audio/")) {
    return Response.json({ error: "Audio file is not ready yet." }, { status: 425 });
  }

  return new Response(audioResponse.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function POST(request) {
  try {
    const apiKey = process.env.FPT_TTS_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "Missing FPT_TTS_API_KEY." }, { status: 500 });
    }

    const body = await request.json();
    const text = String(body?.text || "").trim().slice(0, MAX_TEXT_LENGTH);

    if (text.length < 3) {
      return Response.json({ error: "Text must contain at least 3 characters." }, { status: 400 });
    }

    const voice = String(body?.voice || process.env.FPT_TTS_VOICE || "banmai");
    const speed = String(body?.speed ?? process.env.FPT_TTS_SPEED ?? "0");

    const ttsResponse = await fetch(FPT_TTS_URL, {
      method: "POST",
      headers: {
        "api_key": apiKey,
        "api-key": apiKey,
        "voice": voice,
        "speed": speed,
        "format": "mp3",
        "Cache-Control": "no-cache",
        "Content-Type": "text/plain; charset=utf-8",
      },
      body: text,
      cache: "no-store",
    });

    const payload = await ttsResponse.json().catch(() => null);

    if (!ttsResponse.ok || !payload?.async) {
      return Response.json(
        {
          error: payload?.message || "FPT TTS request failed.",
          detail: payload,
        },
        { status: 502 }
      );
    }

    const audio = await getReadyAudio(payload.async);

    if (!audio) {
      return Response.json(
        {
          error: "Audio file is not ready yet. Please try again.",
          requestId: payload.request_id,
        },
        { status: 425 }
      );
    }

    return new Response(audio.bytes, {
      status: 200,
      headers: {
        "Content-Type": audio.contentType,
        "Cache-Control": "no-store",
        "X-TTS-Provider": "fpt-ai",
        "X-TTS-Request-Id": payload.request_id || "",
      },
    });
  } catch (error) {
    return Response.json({ error: error.message || "Unable to generate speech." }, { status: 500 });
  }
}
