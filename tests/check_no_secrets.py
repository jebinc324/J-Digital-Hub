#!/usr/bin/env python3
"""Basic accidental-credential guard; not a full historical secret scanner."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
patterns = [
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"github_pat_[A-Za-z0-9_]{32,}"),
    re.compile(r"gh[pousr]_[A-Za-z0-9_]{32,}"),
]
for folder in (ROOT / "public", ROOT / "admin", ROOT / ".github", ROOT / "backend"):
    for file in folder.rglob("*"):
        if not file.is_file() or file.suffix not in (".py", ".js", ".html", ".json", ".yml", ".yaml", ".env", ".sql"):
            continue
        content = file.read_text(encoding="utf-8", errors="replace")
        assert not any(rule.search(content) for rule in patterns), f"Potential secret in {file}"
print("Basic credential-pattern scan passed (not a Git history scan)")
