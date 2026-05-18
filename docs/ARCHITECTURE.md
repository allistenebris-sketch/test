# FoxDuplicateFinder — архитектурный план

## Pipeline сравнения
1. **Быстрый фильтр**: размер, разрешение, длительность, codec.
2. **Hash-уровень**: SHA256/BLAKE3/perceptual hash.
3. **AI/CV-уровень**: CLIP embeddings + cosine similarity + OpenCV признаки.
4. **Верификация**: SSIM, feature matching, покадровое сравнение видео.

## Основные подсистемы
- `scanners/`: обход локальных/USB/сетевых папок, hotplug-мониторинг.
- `hashing/`: exact hash и perceptual hash для изображений и кадров видео.
- `video/`: извлечение ключевых кадров, scene detection, аудио-отпечатки.
- `ai/`: inference embeddings, кластеризация похожих объектов.
- `database/`: SQLite индекс (hashes, embeddings, metadata, scan history).
- `gui/`: PySide6/PyQt6 UI, предпросмотр, управление результатами.
- `cli/`: автоматизация сканирования и экспорта.
- `exporters/`: JSON/CSV/HTML отчёты.

## Порядок реализации (MVP -> Full)
1. Exact duplicates (размер + SHA256/BLAKE3).
2. Perceptual image duplicates (pHash/dHash + SSIM).
3. Video keyframe hash + scene matching.
4. CLIP/OpenCV deep similarity.
5. GUI-функции предпросмотра, quarantine/undo, профили сканирования.
