import json
import os
import pytest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent


def get_nested_keys(d, prefix=""):
    keys = set()
    for k, v in d.items():
        full_key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            keys.update(get_nested_keys(v, full_key))
        else:
            keys.add(full_key)
    return keys


def test_lng_01_no_missing_locale_keys():
    """LNG-01: Verify all keys in en.json exist in hi.json and te.json."""
    locales_dir = ROOT_DIR / "frontend" / "locales"
    en_path = locales_dir / "en.json"
    hi_path = locales_dir / "hi.json"
    te_path = locales_dir / "te.json"

    assert en_path.exists(), "en.json must exist"
    assert hi_path.exists(), "hi.json must exist"
    assert te_path.exists(), "te.json must exist"

    with open(en_path, "r", encoding="utf-8") as f:
        en_data = json.load(f)
    with open(hi_path, "r", encoding="utf-8") as f:
        hi_data = json.load(f)
    with open(te_path, "r", encoding="utf-8") as f:
        te_data = json.load(f)

    en_keys = get_nested_keys(en_data)
    hi_keys = get_nested_keys(hi_data)
    te_keys = get_nested_keys(te_data)

    missing_hi = en_keys - hi_keys
    missing_te = en_keys - te_keys

    assert len(missing_hi) == 0, f"Missing keys in hi.json: {missing_hi}"
    assert len(missing_te) == 0, f"Missing keys in te.json: {missing_te}"


def test_lng_02_telugu_hindi_characters_render():
    """LNG-02: Verify Telugu and Devanagari text contains valid non-ASCII codepoints without corrupted tofu bytes."""
    locales_dir = ROOT_DIR / "frontend" / "locales"
    
    with open(locales_dir / "hi.json", "r", encoding="utf-8") as f:
        hi_str = f.read()
    with open(locales_dir / "te.json", "r", encoding="utf-8") as f:
        te_str = f.read()

    # Devanagari Unicode range: 0x0900 - 0x097F
    has_devanagari = any(0x0900 <= ord(c) <= 0x097F for c in hi_str)
    assert has_devanagari, "hi.json must contain authentic Devanagari characters"

    # Telugu Unicode range: 0x0C00 - 0x0C7F
    has_telugu = any(0x0C00 <= ord(c) <= 0x0C7F for c in te_str)
    assert has_telugu, "te.json must contain authentic Telugu characters"


def test_lng_03_concept_id_pairs_in_sample_questions():
    """LNG-03: concept_id exists for sample questions enabling bilingual pairing."""
    sample_file = ROOT_DIR / "content" / "sample_questions.json"
    assert sample_file.exists()

    with open(sample_file, "r", encoding="utf-8") as f:
        questions = json.load(f)

    assert len(questions) > 0

    concept_ids = set()
    langs_per_concept = {}

    for q in questions:
        cid = q.get("concept_id")
        assert cid, f"Question missing concept_id: {q.get('id')}"
        concept_ids.add(cid)

        lang = q.get("language")
        if cid not in langs_per_concept:
            langs_per_concept[cid] = set()
        langs_per_concept[cid].add(lang)

    assert len(concept_ids) > 0
    # Verify that concepts have multiple languages available
    paired_concepts = [c for c, langs in langs_per_concept.items() if len(langs) > 1]
    assert len(paired_concepts) > 0, "Expected paired multilingual concepts across questions"


def test_lng_04_audio_tts_language_mapping():
    """LNG-04: Audio read-aloud language mapping tags properly configured."""
    tts_file = ROOT_DIR / "frontend" / "lib" / "tts.ts"
    assert tts_file.exists()
    content = tts_file.read_text(encoding="utf-8")

    assert "te-IN" in content, "Telugu BCP 47 code te-IN must be supported in TTS"
    assert "hi-IN" in content, "Hindi BCP 47 code hi-IN must be supported in TTS"
    assert "en-IN" in content or "en-US" in content, "English code must be supported in TTS"
