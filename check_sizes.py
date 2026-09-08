import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def get_dir_size_mb(path):
    total = 0
    for root_dir, dirs, files in os.walk(path):
        for f in files:
            fp = os.path.join(root_dir, f)
            try:
                total += os.path.getsize(fp)
            except:
                pass
    return total / (1024 * 1024)

def check_all_folders():
    header = f"{'Folder Name':<35} {'Size (MB)':<12} {'Status (< 25MB)'}"
    print(header)
    print("=" * 65)

    all_under_25 = True
    for item in sorted(ROOT.iterdir()):
        if item.is_dir() and not item.name.startswith("."):
            size = get_dir_size_mb(item)
            passed = size < 25.0
            if not passed:
                all_under_25 = False
            status = "PASS (< 25MB)" if passed else "FAIL (>= 25MB)"
            print(f"{item.name:<35} {size:>6.2f} MB     {status}")

    print("=" * 65)
    if all_under_25:
        print("SUCCESS: EVERY SINGLE FOLDER IS UNDER 25 MB AND READY FOR GITHUB UPLOAD!")
    else:
        print("WARNING: Some folders exceed 25 MB.")

if __name__ == "__main__":
    check_all_folders()
