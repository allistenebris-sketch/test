# FoxDuplicateFinder

Стартовый каркас проекта для сервиса поиска дубликатов фото и видео (GUI + CLI) под Windows.

## Что уже заложено
- Базовая структура модулей по ТЗ.
- CLI-точка входа `foxdup` с командой `scan` и `export`.
- Заготовка конфигурации и режимов сканирования.
- Документ архитектуры и поэтапный план реализации.

## Быстрый старт
```bash
python -m foxduplicatefinder.cli.main scan D:/Photos --mode deep
```

## Структура
См. `docs/ARCHITECTURE.md`.
