#!/usr/bin/env python3
"""Export a clearly labelled fictional promotional film for this static preview."""
from pathlib import Path
import argparse
import subprocess
import tempfile

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path, help='Approved original promotional clip')
parser.add_argument('--output-dir', type=Path, default=Path(__file__).resolve().parents[1] / 'assets')
args = parser.parse_args()
args.output_dir.mkdir(parents=True, exist_ok=True)
video = args.output_dir / 'vision-film.mp4'
poster = args.output_dir / 'vision-poster.webp'
font = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
with tempfile.TemporaryDirectory() as temporary:
    label = Path(temporary) / 'label.txt'
    label.write_text('AI-created dramatization | Fictional speakers', encoding='utf-8')
    filter_spec = f'drawtext=fontfile={font}:textfile={label}:fontsize=26:fontcolor=white:x=22:y=20:box=1:boxcolor=black@0.75:boxborderw=10'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(args.source), '-map', '0:v:0', '-map', '0:a:0?', '-vf', filter_spec, '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-map_metadata', '-1', '-movflags', '+faststart', str(video)], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '0.8', '-i', str(video), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '84', str(poster)], check=True)
print('Exported', video)
print('Exported', poster)
