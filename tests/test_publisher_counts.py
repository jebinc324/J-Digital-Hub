"""Scoping regression: a catalogue count must never rewrite unrelated numbers."""
import json
from pathlib import Path
import runpy
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".github/scripts"))
publisher = runpy.run_path(str(ROOT / ".github/scripts/publish_j_app.py"))
update = publisher["update_visible_counts"]


class CountsTest(unittest.TestCase):
    def test_only_explicit_markers_change(self):
        items = json.loads((ROOT / "public/apps/catalog.json").read_text())["items"]
        extra = dict(items[0])
        extra["id"] = "new-test-project"
        extra["releaseAsset"] = "new-test-project.apk"
        extra["downloadUrl"] = ("https://github.com/jebinc324/J-Digital-Hub/"
                                "releases/download/just24-public-v1/new-test-project.apk")
        expanded = [*items, extra]
        expected_count = len(expanded)
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            for rel in ("public/index.html", "public/apps/index.html",
                        "public/apps/access/index.html"):
                dest = base / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_text((ROOT / rel).read_text(encoding="utf-8") +
                                "\n<!-- unrelated notice: 43 -->", encoding="utf-8")
            updates = update(base, len(items), expanded)
            self.assertEqual(len(updates), 3)
            for text in updates.values():
                self.assertIn("unrelated notice: 43", text)
                self.assertIn(f'data-count-total>{expected_count}', text)
            apps = updates[base / "public/apps/index.html"]
            self.assertIn('data-family="all"', apps)
            self.assertIn(f'<strong id="j-ready-count">{expected_count}</strong>', apps)
            access = updates[base / "public/apps/access/index.html"]
            self.assertIn(f"data-count-ready>{expected_count}", access)
            self.assertIn("data-count-pending>0", access)


if __name__ == "__main__":
    unittest.main()
