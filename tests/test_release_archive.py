"""Local unit checks for release archive integrity and traversal detection."""
import io
from pathlib import Path
import runpy
import unittest
import zipfile

verify = runpy.run_path(str(Path(__file__).resolve().parents[1] / ".github/scripts/verify_release.py"))
inspect = verify["inspect_archive"]


def archive(entries):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w") as out:
        for name, body in entries.items():
            out.writestr(name, body)
    stream.seek(0)
    return stream


class ArchiveTest(unittest.TestCase):
    def test_good_apk(self):
        self.assertTrue(inspect(archive({"AndroidManifest.xml": b"binary", "classes.dex": b"binary"}), "app.apk"))

    def test_good_zip(self):
        self.assertTrue(inspect(archive({"doc/readme.txt": b"Readme"}), "package.zip"))

    def test_non_archive_dynamo(self):
        self.assertFalse(inspect(io.BytesIO(b'{"Nodes":[]}'), "model.dyn"))

    def test_traversal_blocked(self):
        with self.assertRaisesRegex(ValueError, "unsafe filename"):
            inspect(archive({"../private.txt": b"bad"}), "package.zip")

    def test_keystore_blocked(self):
        with self.assertRaisesRegex(ValueError, "secret"):
            inspect(archive({"release.jks": b"bad"}), "package.zip")

    def test_missing_manifest_blocked(self):
        with self.assertRaisesRegex(ValueError, "AndroidManifest"):
            inspect(archive({"classes.dex": b"binary"}), "app.apk")


if __name__ == "__main__":
    unittest.main()
