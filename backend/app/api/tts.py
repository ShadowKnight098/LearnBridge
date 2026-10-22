from fastapi import APIRouter, Query, HTTPException, Response
import httpx
import re

router = APIRouter(prefix="/tts", tags=["Text-to-Speech"])

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "audio/mpeg, audio/*;q=0.9, */*;q=0.8",
}


@router.get("", summary="Synthesize speech audio stream for multilingual text")
async def text_to_speech(
    text: str = Query(..., description="Text string to synthesize"),
    lang: str = Query("en", description="Target language: 'te' (Telugu), 'hi' (Hindi), or 'en' (English)")
):
    clean_text = re.sub(r"<[^>]*>", "", text).strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text parameter cannot be empty")

    clean_text = clean_text[:250]
    target_lang = "te" if lang == "te" else ("hi" if lang == "hi" else "en")
    url = "https://translate.google.com/translate_tts"
    params = {
        "ie": "UTF-8",
        "client": "tw-ob",
        "tl": target_lang,
        "q": clean_text
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, params=params, headers=HEADERS)
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=resp.status_code,
                    detail="Upstream speech provider unavailable"
                )

            return Response(
                content=resp.content,
                media_type="audio/mpeg",
                headers={
                    "Cache-Control": "public, max-age=604800",
                    "Content-Type": "audio/mpeg",
                    "Content-Disposition": "inline"
                }
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"TTS synthesis error: {str(e)}")
