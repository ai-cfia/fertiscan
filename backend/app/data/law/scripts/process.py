# /// script
# dependencies = [
#   "beautifulsoup4",
#   "markitdown",
# ]
# ///

import argparse
import os
from pathlib import Path

from bs4 import BeautifulSoup
from markitdown import MarkItDown


def process_law(name, lang, source_dir, output_dir):
    html_file = source_dir / f"{name}_{lang}.html"
    md_file = output_dir / f"{name}_{lang}.md"

    if not html_file.exists():
        print(f"[-] File not found: {html_file}")
        return

    print(f"[*] Processing {lang.upper()} version of {name}...")

    with open(html_file, encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")

    # Target the generic <main> tag
    main_content = soup.find("main")

    if not main_content:
        print(f"[!] Could not find <main> content in {html_file}")
        return

    # Clean up unhelpful website-specific elements if they exist
    junk_selectors = [
        "nav",
        "#printAll",
        ".tocBar",
        ".info",
        ".PITLink",
        "section.pagedetails",
        "footer",
    ]
    for selector in junk_selectors:
        for element in main_content.select(selector):
            element.decompose()

    final_html = str(main_content)

    # Use a temporary file for conversion
    temp_html = source_dir / f"temp_{name}_{lang}.html"
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(f"<html><body>{final_html}</body></html>")

    try:
        md = MarkItDown()
        result = md.convert(str(temp_html))

        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

        with open(md_file, "w", encoding="utf-8") as f:
            f.write(result.text_content)
        print(f"[+] Successfully built {md_file}")
    finally:
        if temp_html.exists():
            os.remove(temp_html)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Clean and convert Law HTML to Markdown."
    )
    parser.add_argument(
        "--name", required=True, help="Base name of the files (e.g. fertilizers_act)"
    )

    args = parser.parse_args()

    script_dir = Path(__file__).parent
    source_dir = (script_dir / "../source_html").resolve()
    output_dir = (script_dir / "../markdown").resolve()

    process_law(args.name, "en", source_dir, output_dir)
    process_law(args.name, "fr", source_dir, output_dir)
