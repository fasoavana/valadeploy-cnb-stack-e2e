#!/usr/bin/env python3
"""Crée le payload exact de l'API Stack SANS lancer de déploiement."""
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

if len(sys.argv) != 2:
    raise SystemExit('Usage : python3 generer_payload.py https://github.com/USER/REPO.git')
repo = sys.argv[1]
p = urlsplit(repo)
if p.scheme != 'https' or not p.netloc or p.username or p.password or not p.path or p.query or p.fragment:
    raise SystemExit('URL Git HTTPS non valide ; ne pas fournir d’identifiants dans l’URL.')
template = Path(__file__).with_name('stack-payload.template.json')
obj = json.loads(template.read_text(encoding='utf-8'))
for c in obj['components']:
    if c['kind'] in ('back','front'):
        c['repo_url'] = repo
output = Path(__file__).with_name('stack-payload.json')
if output.exists(): raise SystemExit('stack-payload.json existe déjà : rien écrasé.')
output.write_text(json.dumps(obj, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
print('PAYLOAD_STACK_CNB=' + str(output))
print('DEPLOIEMENT_LANCE=NON')
