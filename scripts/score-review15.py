from pathlib import Path
import importlib.util,json,sys
root=Path(__file__).resolve().parents[1]
raw=Path(sys.argv[1]).resolve();out=Path(sys.argv[2]).resolve();assert not out.exists()
spec=importlib.util.spec_from_file_location('accepted_scorer',root/'scripts/summarize-review14.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.BASE=raw.parent.parent
result=m.score(raw)
out.write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({'targetMet':result['targetMet'],'attempts':result['attempts']},indent=2))
sys.exit(not result['targetMet'])
