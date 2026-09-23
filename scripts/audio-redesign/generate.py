"""Bounded ElevenLabs authoring. Key is process-only; no credentials in receipts.
No automatic retries, purchases or account mutations. Resume skips existing files.
Usage: ELEVENLABS_API_KEY in process environment; python .../generate.py [id ...]
"""
from pathlib import Path
import os, sys, json, urllib.request, urllib.error, hashlib, datetime

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/audio-redesign/sources'; OUT.mkdir(parents=True,exist_ok=True)
PLAN=[]
def sfx(name, seconds, prompt, loop=False):
    PLAN.append(dict(id=name, kind='sfx', seconds=seconds, loop=loop, prompt=prompt))
for vehicle, description in [('sling','naturally aspirated inline four cylinder open cockpit roadster, tight low exhaust growl, dry mechanical intake'),('ryker','compact 900 cc inline three cylinder motorcycle, rounded uneven textured exhaust burble, subtle CVT mechanical whirr')]:
    for rpm,word in [(1200,'idle'),(3000,'medium'),(6000,'high')]:
        sfx(f'{vehicle}-{rpm}',8,f'Isolated close engine: {description}. Steady {word} speed about {rpm} RPM throughout, constant moderate load. Rich physical combustion pulses and airy intake. No acceleration, no gear shifts, no pass by, no tire noise, no music, no speech, no wind. Dry, even level, seamless loop.',True)
sfx('harbor',18,'Quiet waterfront marina ambience from a quayside at golden hour. Soft small water laps, distant gulls, subtle mooring rope creaks and very distant low port activity. Spacious gentle stereo. No engines close by, no voices, no music. Continuous natural bed, no dramatic events.',True)
sfx('express',18,'Open coastal highway verge ambience on a calm warm evening. Broad gentle sea breeze through dry grasses, distant ocean wash, very distant subdued traffic. Spacious restrained stereo natural environment, no close vehicle passes, no horns, no speech, no music.',True)
sfx('ridge',18,'Peaceful Appalachian ridge forest outdoor ambience. Soft wind in broadleaf trees, a few distant woodland birds, subtle insect texture. Spacious natural stereo field recording. No music, no people, no owl cliches, no close sharp bird calls. Continuous calm texture.',True)
sfx('night',16,'Subtle outdoor blue hour ambience, distant small insects and crickets with a soft breeze. Sparse spacious night air, no close shrill insects, no birds, no music, no voices. Seamless quiet stereo bed.',True)
sfx('rain',16,'Gentle steady rainfall on asphalt, tiny fine water splashes, broad natural diffuse stereo rain texture. No thunder, no music, no roof drumming, no voices. Consistent soft rain bed.',True)
sfx('showroom',16,'Quiet premium automotive workshop interior room tone. Soft distant ventilation air, almost imperceptible building hum, subtle spacious enclosed air. No machinery running, no footsteps, no voices, no music. Continuous even bed.',True)
sfx('tire-scrub',6,'Isolated rubber tire scrub loop on dry asphalt in a tight fast corner. Textured rubber friction and low gritty chatter, restrained midrange squeal, not piercing. Constant sustained medium intensity, no engine, no crash, no voices, no music.',True)
sfx('gravel',6,'Close isolated fine gravel rolling and crunching beneath a moving rubber road tire at moderate speed, continuous textured soft grit and little pebble ticks. No engine, no music, no voices, steady loop.',True)
sfx('wet-tire',6,'Close isolated rolling rubber tire hiss spraying a fine film of water from wet asphalt. Smooth soft broadband spray and water patter. No engine, no music, no voices, steady loop.',True)
sfx('road',8,'Isolated continuous rolling rubber tire sound on smooth asphalt at medium road speed. Warm low road rumble, soft textured rubber hiss, no rhythmic joins, no engine, no wind, no music, no voices. Seamless loop.',True)
sfx('wind',8,'Soft airflow past an open vehicle cockpit at steady moderate speed. Smooth low wind buffeting and airy broadband texture without harsh whistle. No engine, no road noise, no music, no voices. Seamless loop.',True)
sfx('impact',2,'One restrained realistic low speed automotive barrier impact: short heavy rubber plastic and metal body thud with a few small gritty debris ticks. Immediate attack and short natural decay. No glass explosion, no Hollywood boom, no voice, no engine, no music.')
sfx('suspension',1,'Single close dry automotive suspension compression over a road joint: muted low rubber bushing thump with small metal tick, compact solid mechanical weight, short clean tail. No engine, no music, no voices.')
sfx('shift',1,'Single close dry mechanical gear engagement click and low clunk from a compact sporty gearbox. Quick precise tactile metal movement, no grind, no engine, no music, no voices.')
sfx('fit-metal',2,'Single premium workshop assembly sound: short socket ratchet turn followed by a precise solid metal part seating clack. Close dry detailed tactile foley, no room noise, no voices, no music.')
sfx('fit-panel',1.5,'Single high quality automotive polymer body panel seating sound, short soft movement followed by two close tight muted clicks. Dry close foley, no voices, no music.')
sfx('paint',2,'One short refined automotive paint spray pass, soft airbrush hiss swells gently and releases with tiny trigger click. Close dry clean foley, no room noise, no music, no voices.')
sfx('latch',1,'One solid premium luggage compartment latch closing. Soft padded thunk then precise small metal click. Dry detailed close foley, no voices, no music.')
sfx('ignition-sling',3,'One compact sporty four cylinder engine ignition: brief starter churn, immediate warm engine catch and settles to a low idle. Dry close engine foley, no acceleration, no music, no voices.')
sfx('ignition-ryker',3,'One 900cc inline three cylinder motorcycle engine ignition: brief electric starter churn, engine catches with a rounded growl, settles to soft idle. Dry close foley, no acceleration, no music, no voices.')
for name,seconds,prompt in [
 ('music-garage',64,'Premium automotive exploration game garage and main menu instrumental. 92 BPM D minor, understated cinematic electronica, warm analog bass, brushed live percussion, small clean electric guitar motifs, spacious restrained pads, optimistic craftsmanship and open road anticipation. A memorable four note motif, polished intimate mix, sparse melody leaving room for interface foley. No epic orchestra, no EDM drops, no vocals. Maintain a consistent relaxed groove, clean eight bar phrases, gently resolving ending.'),
 ('music-race',64,'Premium coastal motorsport game instrumental. 120 BPM D minor, focused cinematic breakbeat electronica, tight live drums, warm driving synth bass, restrained gritty electric guitar accents, subtle rising pulse, confident forward motion and clean momentum. Use a short four note rising motif with plenty of space, no piercing lead or huge sub bass. No vocals, no sirens, no engine effects, no giant EDM drop. Consistent groove in eight bar phrases, ending on a clean resolved downbeat.'),
 ('music-ridge',64,'Scenic mountain road driving game instrumental. 100 BPM D minor, spacious organic downtempo electronica, muted electric guitar harmonics, low warm bass, soft live tom percussion and airy analog pads. Reflective freedom, confident open road warmth, little melodic detail, no sentimental piano. No vocals, no sound effects, no huge drops. Short subtle four note motif, clean eight bar phrases, restrained dynamic mix, gentle resolved ending.')]:
    PLAN.append(dict(id=name,kind='music',seconds=seconds,loop=True,prompt=prompt))
(OUT.parent/'generation-plan.json').write_text(json.dumps(PLAN,indent=2)+'\n')
if '--plan' in sys.argv: print(len(PLAN),'planned assets'); sys.exit()
key=os.environ.get('ELEVENLABS_API_KEY'); assert key,'Set process-only ELEVENLABS_API_KEY'
selected=set(sys.argv[1:]); receipt=OUT.parent/'generation-receipt.json'
records=json.loads(receipt.read_text()) if receipt.exists() else []
used=sum(float(x.get('characterCost') or 0) for x in records)
for item in PLAN:
    if selected and item['id'] not in selected: continue
    dest=OUT/(item['id']+'.mp3')
    if dest.exists(): continue
    if used>=30000: print('Authoring credit ceiling reached'); break
    music=item['kind']=='music'
    body=({'prompt':item['prompt'],'music_length_ms':int(item['seconds']*1000),'force_instrumental':True,'model_id':'music_v1'} if music else {'text':item['prompt'],'duration_seconds':item['seconds'],'loop':item['loop'],'prompt_influence':.45,'model_id':'eleven_text_to_sound_v2'})
    req=urllib.request.Request('https://api.elevenlabs.io/v1/'+('music' if music else 'sound-generation')+'?output_format=mp3_44100_128',data=json.dumps(body).encode(),headers={'xi-api-key':key,'Content-Type':'application/json'})
    print('Generating',item['id'],flush=True)
    try:
        with urllib.request.urlopen(req,timeout=240) as response:
            data=response.read(); cost=response.headers.get('character-cost'); request=response.headers.get('request-id'); song=response.headers.get('song-id')
        if len(data)<1000: raise ValueError('Empty audio response')
        dest.write_bytes(data); used+=float(cost or 0)
        records.append(dict(id=item['id'],status='created',utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),characterCost=cost,requestId=request,songId=song,model=body['model_id']))
        print('Created',item['id'],len(data),'bytes; reported credits',cost,flush=True)
    except urllib.error.HTTPError as error:
        detail=error.read().decode(errors='replace').replace(key,'[redacted]')
        records.append(dict(id=item['id'],status='failed',http=error.code,detail=detail))
        receipt.write_text(json.dumps(records,indent=2)+'\n')
        print('HTTP',error.code,detail[:500],flush=True)
        break
    except Exception as error:
        records.append(dict(id=item['id'],status='uncertain',error=type(error).__name__))
        receipt.write_text(json.dumps(records,indent=2)+'\n'); print('Stopped without retry:',type(error).__name__); break
    receipt.write_text(json.dumps(records,indent=2)+'\n')
