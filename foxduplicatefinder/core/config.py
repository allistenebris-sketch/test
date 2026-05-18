from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class ScanMode(str, Enum):
    EXACT = "exact"
    IMAGE_PERCEPTUAL = "image-perceptual"
    VIDEO_DUPLICATE = "video-duplicate"
    SIMILARITY = "similarity"
    DEEP = "deep"


@dataclass(slots=True)
class ScanSettings:
    mode: ScanMode = ScanMode.DEEP
    threshold: float = 0.9
    use_gpu: bool = False
    ram_limit_mb: int = 4096
    include_extensions: list[str] = field(default_factory=list)
    exclude_paths: list[str] = field(default_factory=list)
