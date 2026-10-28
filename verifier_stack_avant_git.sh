#!/usr/bin/env bash
set -Eeuo pipefail
cd -- "$(dirname -- "$0")"
echo '===== VALIDATION STACK SANS MODIFICATION DE VALADEPLOY ====='
python3 -m py_compile backend/main.py backend/tests/test_contract.py generer_payload.py
python3 -m unittest discover -s backend/tests -p 'test_*.py' -v
node --check frontend/server.mjs
node --test frontend/tests/*.test.mjs
python3 - <<'PY2'
import json
from pathlib import Path
p = json.loads(Path('stack-payload.template.json').read_text())
assert [c['kind'] for c in p['components']] == ['database','back','front']
assert [c['build_mode'] for c in p['components']] == ['auto','buildpack','buildpack']
assert p['components'][1]['source_subdirectory'] == 'backend'
assert p['components'][2]['source_subdirectory'] == 'frontend'
assert p['components'][2]['envs_var']['BP_NODE_RUN_SCRIPTS'] == 'build'
assert not list(Path('.').rglob('Dockerfile'))
print('SCHEMA_EXEMPLE=PASS')
print('2_COMPONENTS_CNB=OUI')
print('BASE_POSTGRES_OFFICIELLE=OUI')
print('DOCKERFILES=ABSENTS')
PY2
echo 'VALIDATION_HORS_LIGNE=PASS'
echo 'ATTENTION=CE_TEST_NE_VALIDE_NI_LA_DETECTION_PAKETO_NI_LE_PIPELINE_E2E'
