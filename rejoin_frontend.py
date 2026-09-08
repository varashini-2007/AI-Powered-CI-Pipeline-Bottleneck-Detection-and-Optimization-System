"""
Rejoin Script: Restores frontend/node_modules from the 4 split parts (< 25MB each).
Usage:
    python rejoin_frontend.py
"""
import os
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND_NM = ROOT / "frontend" / "node_modules"

PARTS = [
    ROOT / "frontend_part1_lucide",
    ROOT / "frontend_part2_build_tools",
    ROOT / "frontend_part3_bundler_charts",
    ROOT / "frontend_part4_core_deps"
]

def rejoin():
    print(f"Rejoining split parts into {FRONTEND_NM}...")
    FRONTEND_NM.mkdir(parents=True, exist_ok=True)
    
    total_restored = 0
    for part in PARTS:
        if not part.exists():
            print(f"Warning: {part.name} does not exist, skipping.")
            continue
        print(f"Restoring from {part.name}...")
        for item in part.iterdir():
            target = FRONTEND_NM / item.name
            if not target.exists():
                if item.is_dir():
                    shutil.copytree(item, target)
                else:
                    shutil.copy2(item, target)
                total_restored += 1
                
    print(f"Successfully rejoined {total_restored} items into {FRONTEND_NM}!")
    print("Frontend is ready to run with 'npm run dev'!")

if __name__ == "__main__":
    rejoin()
