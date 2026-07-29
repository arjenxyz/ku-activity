#!/usr/bin/env python3
"""Generate locale welcome MP3 clips via Microsoft Edge neural TTS."""

from __future__ import annotations

import asyncio
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "audio" / "locale-welcome"

LOCALES = {
    "tr": ("tr-TR-EmelNeural", "Merhaba, hoş geldiniz"),
    "en": ("en-GB-SoniaNeural", "Hello, welcome"),
    "zh": ("zh-CN-XiaoxiaoNeural", "你好，欢迎"),
    "hi": ("hi-IN-SwaraNeural", "नमस्ते, स्वागत है"),
    "es": ("es-ES-ElviraNeural", "Hola, bienvenidos"),
    "fr": ("fr-FR-DeniseNeural", "Bonjour, bienvenue"),
    "ar": ("ar-SA-ZariyahNeural", "مرحباً، أهلاً بك"),
    "bn": ("bn-BD-NabanitaNeural", "হ্যালো, স্বাগতম"),
    "pt": ("pt-BR-FranciscaNeural", "Olá, bem-vindo"),
    "ru": ("ru-RU-SvetlanaNeural", "Здравствуйте, добро пожаловать"),
    "ur": ("ur-PK-UzmaNeural", "سلام، خوش آمدید"),
    "id": ("id-ID-GadisNeural", "Halo, selamat datang"),
    "de": ("de-DE-KatjaNeural", "Hallo, willkommen"),
    "ja": ("ja-JP-NanamiNeural", "こんにちは、ようこそ"),
    "hu": ("hu-HU-NoemiNeural", "Helló, üdvözöljük"),
}


async def generate_one(locale: str, voice: str, text: str) -> None:
    out_path = OUT_DIR / f"{locale}.mp3"
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(out_path))
    print(f"Wrote {out_path.relative_to(ROOT)} ({voice})")


async def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for locale, (voice, text) in LOCALES.items():
        await generate_one(locale, voice, text)


if __name__ == "__main__":
    asyncio.run(main())
