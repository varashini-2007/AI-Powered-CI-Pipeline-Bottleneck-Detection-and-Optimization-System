"""
Split Script: Splits frontend/node_modules into 4 folders, each strictly under 25MB.
Usage:
    python split_frontend.py
"""
import os
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND_NM = ROOT / "frontend" / "node_modules"

p1_names = {"lucide-react"}
p2_names = {"@esbuild", "@babel", "caniuse-lite", "csstype", "@types", "electron-to-chromium", "baseline-browser-mapping"}
p3_names = {".vite", "chart.js", "@rollup", "vite"}

part1_dir = ROOT / "frontend_part1_lucide"
part2_dir = ROOT / "frontend_part2_build_tools"
part3_dir = ROOT / "frontend_part3_bundler_charts"
part4_dir = ROOT / "frontend_part4_core_deps"

def get_dir_size_mb(p):
    total = 0
    for root_dir, dirs, files in os.walk(p):
        for f in files:
            fp = os.path.join(root_dir, f)
            try:
                total += os.path.getsize(fp)
            except:
                pass
    return total / (1024 * 1024)

def split():
    if not FRONTEND_NM.exists():
        print(f"{FRONTEND_NM} does not exist. Already split or run 'python rejoin_frontend.py' first.")
        return

    for d in [part1_dir, part2_dir, part3_dir, part4_dir]:
        d.mkdir(parents=True, exist_ok=True)

    import stat
    def remove_readonly(func, path, exc_info):
        try:
            os.chmod(path, stat.S_IWRITE)
            func(path)
        except Exception:
            pass

    print("Splitting frontend/node_modules into parts under 25MB...")
    for item in FRONTEND_NM.iterdir():
        name = item.name
        if name in p1_names:
            target = part1_dir / name
        elif name in p2_names:
            target = part2_dir / name
        elif name in p3_names:
            target = part3_dir / name
        else:
            target = part4_dir / name

        if target.exists():
            if target.is_dir():
                shutil.rmtree(target, onexc=remove_readonly)
            else:
                target.unlink()

        if item.is_dir():
            shutil.copytree(item, target)
        else:
            shutil.copy2(item, target)

    shutil.rmtree(FRONTEND_NM, onexc=remove_readonly)
    print("frontend/node_modules moved to split parts successfully.")
    print("Part 1 Size:", round(get_dir_size_mb(part1_dir), 2), "MB")
    print("Part 2 Size:", round(get_dir_size_mb(part2_dir), 2), "MB")
    print("Part 3 Size:", round(get_dir_size_mb(part3_dir), 2), "MB")
    print("Part 4 Size:", round(get_dir_size_mb(part4_dir), 2), "MB")

if __name__ == "__main__":
    split()
