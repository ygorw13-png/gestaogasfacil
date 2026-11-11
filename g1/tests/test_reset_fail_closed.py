"""Confere propagação de falha do psql sem executar SQL ou recriar banco."""
from pathlib import Path
import os
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]

class ResetFailClosed(unittest.TestCase):
    def test_scripts(self):
        for number in range(4,10):
            original = (ROOT / f'g1/tests/sql/reset_com{number:03}.sh').read_text()
            # Exercita a chamada psql real do script; dependências e reset ficam fora desta unidade.
            line = next(line for line in original.splitlines() if line.startswith('psql "$U"') and '-1' in line)
            for exit_code in (0,42):
                with self.subTest(number=number, exit_code=exit_code), tempfile.TemporaryDirectory() as tmp:
                    fake = Path(tmp)/'psql'
                    fake.write_text(f'#!/bin/sh\nexit {exit_code}\n')
                    fake.chmod(0o755)
                    script = f'set -euo pipefail\nU=local\nROOT={ROOT}\n{line}\necho "{number:03} aplicado"\n'
                    result = subprocess.run(['bash'], input=script, text=True, capture_output=True,
                        env={**os.environ,'PATH':tmp+os.pathsep+os.environ['PATH']})
                    self.assertEqual(result.returncode, exit_code)
                    self.assertEqual('aplicado' in result.stdout, exit_code == 0)

if __name__ == '__main__': unittest.main()
