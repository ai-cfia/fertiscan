# /// script
# dependencies = [
#   "requests",
#   "beautifulsoup4",
#   "markitdown",
# ]
# ///

import json
import subprocess
from pathlib import Path


def main():
    script_dir = Path(__file__).parent
    base_dir = (script_dir / "../../").resolve()  # backend/app/data/
    legislations_path = base_dir / "legislations.json"

    if not legislations_path.exists():
        print(f"[!] legislations.json not found at {legislations_path}")
        return

    with open(legislations_path, encoding="utf-8") as f:
        legislations = json.load(f)

    for doc in legislations:
        title = doc.get("title_en", "unknown")
        # Generate a safe filename slug
        name = title.lower().replace(" ", "_").replace(",", "").replace(".", "")
        en_url = doc.get("source_url_en")
        fr_url = doc.get("source_url_fr")

        if not en_url or not fr_url:
            print(f"[-] Skipping {title}: URLs missing.")
            continue

        print(f"\n[***] Building {title} ({name}) [***]")

        # 1. Download
        print("[*] Step 1: Downloading HTML...")
        subprocess.run(
            [
                "uv",
                "run",
                str(script_dir / "download.py"),
                "--name",
                name,
                "--en",
                en_url,
                "--fr",
                fr_url,
            ],
            check=True,
        )

        # 2. Process (Clean & Convert)
        print("[*] Step 2: Processing HTML to Markdown...")
        subprocess.run(
            ["uv", "run", str(script_dir / "process.py"), "--name", name], check=True
        )

    print("\n[+] All law documents built successfully.")


if __name__ == "__main__":
    main()
