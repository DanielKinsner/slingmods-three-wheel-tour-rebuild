"""Append new production assets without reformatting historical mixed line endings."""
import json,re
def append_assets(path,items):
    raw=path.read_bytes();current=json.loads(raw);extra=[x for x in dict.fromkeys(items) if x not in current['assets']]
    if not extra:return
    close=re.search(rb'(\r?\n)  \],',raw)
    if not close:raise ValueError('Expected the production assets list')
    addition=b',\n'+',\n'.join('    '+json.dumps(x) for x in extra).encode()
    path.write_bytes(raw[:close.start()]+addition+raw[close.start():])
