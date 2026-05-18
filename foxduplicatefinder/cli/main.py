from __future__ import annotations

import argparse
from pathlib import Path

from foxduplicatefinder.core.config import ScanMode


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="foxdup", description="FoxDuplicateFinder CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    scan = subparsers.add_parser("scan", help="Сканирование директорий")
    scan.add_argument("paths", nargs="+", help="Пути для сканирования")
    scan.add_argument("--mode", choices=[m.value for m in ScanMode], default=ScanMode.EXACT.value)
    scan.add_argument("--deep", action="store_true", help="Эквивалент режима deep")
    scan.add_argument("--video-only", action="store_true")

    export_cmd = subparsers.add_parser("export", help="Экспорт результатов")
    export_cmd.add_argument("output", help="Путь к файлу экспорта (json/csv/html)")

    return parser


def run_scan(args: argparse.Namespace) -> int:
    mode = ScanMode.DEEP.value if args.deep else args.mode
    sources = [str(Path(p)) for p in args.paths]
    print(f"[foxdup] scan started | mode={mode} | video_only={args.video_only}")
    for src in sources:
        print(f" - source: {src}")
    print("[foxdup] pipeline: metadata -> hash -> ai -> verification")
    print("[foxdup] status: scaffold implementation (core algorithms pending)")
    return 0


def run_export(args: argparse.Namespace) -> int:
    print(f"[foxdup] exporting results to: {args.output}")
    print("[foxdup] status: exporter scaffold implementation")
    return 0


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "scan":
        return run_scan(args)
    if args.command == "export":
        return run_export(args)
    parser.error("Unknown command")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
