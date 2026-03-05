# /// script
# dependencies = [
#   "requests",
# ]
# ///

import argparse
import os

import requests


def download_law(name, en_url, fr_url, output_dir):
    """Downloads English and French versions of a law as HTML."""

    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    files = {f"{name}_en.html": en_url, f"{name}_fr.html": fr_url}

    for filename, url in files.items():
        print(f"[*] Downloading {url}...")
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()

            response.encoding = response.apparent_encoding
            filepath = os.path.join(output_dir, filename)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(response.text)
            print(f"[+] Saved to {filepath}")

        except requests.RequestException as e:
            print(f"[!] Error downloading {url}: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download law HTML files.")
    parser.add_argument(
        "--name", required=True, help="Base name (e.g. fertilizers_act)"
    )
    parser.add_argument("--en", required=True, help="English URL")
    parser.add_argument("--fr", required=True, help="French URL")
    parser.add_argument("--out", default="../source_html/", help="Output directory")

    args = parser.parse_args()

    # Resolve output directory relative to script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, args.out)

    download_law(args.name, args.en, args.fr, output_path)
