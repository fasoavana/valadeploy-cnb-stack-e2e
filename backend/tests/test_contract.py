from pathlib import Path
import unittest


class StackContractTest(unittest.TestCase):
    def test_cnb_procfile(self):
        self.assertIn('uvicorn main:app', Path(__file__).resolve().parents[1].joinpath('Procfile').read_text())

    def test_no_dockerfile(self):
        self.assertFalse(Path(__file__).resolve().parents[1].joinpath('Dockerfile').exists())


if __name__ == '__main__':
    unittest.main()
