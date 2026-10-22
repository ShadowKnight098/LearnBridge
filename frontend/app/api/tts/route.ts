import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") || "";
  const lang = searchParams.get("lang") || "en";

  if (!text.trim()) {
    return new NextResponse("Text parameter is required", { status: 400 });
  }

  // Clean HTML tags and limit length for single utterance
  const cleanText = text.replace(/<[^>]*>?/gm, "").trim().slice(0, 250);
  const targetLang = lang === "te" ? "te" : lang === "hi" ? "hi" : "en";

  try {
    const upstreamUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${targetLang}&q=${encodeURIComponent(
      cleanText
    )}`;

    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "audio/mpeg, audio/*;q=0.9, */*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,hi;q=0.8,te;q=0.7",
      },
      cache: "force-cache",
    });

    if (!response.ok) {
      console.error(
        `Upstream TTS failed: status ${response.status} ${response.statusText}`
      );
      return new NextResponse("Failed to fetch audio from speech synthesis provider", {
        status: response.status,
      });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch (error: any) {
    console.error("TTS Proxy Route Exception:", error);
    return new NextResponse("Speech synthesis service error", { status: 500 });
  }
}
