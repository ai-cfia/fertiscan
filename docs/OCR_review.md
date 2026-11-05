# OCR Review

## Scope

A SOTA review of current available OCR approaches and models is required.

Include key information such as GitHub and Hugging Face sources, a release
publication, benchmark results, a LinkedIn post if available, the releasing
company or group, parameter count, and whether the model outputs text only or
includes bounding-box coordinates.

FertiScan currently has no separate OCR step. The backend
([`backend/app/services/extraction.py`](../backend/app/services/extraction.py))
sends label photos directly to GPT-4o on Azure OpenAI and uses instructor to
parse the reply into structured fields.

Options are ranked against what an OCR step would need to add: reliable reading
of phone photos of packaging, bilingual EN/FR text, bounding boxes for inspector
review, and a license a federal agency can use.

Benchmark note: see the comparison section.

## Summary

### Approach

| Approach | Count | Models |
| --- | --- | --- |
| VLM alone (end-to-end) | 11 | LightOnOCR-3, OvisOCR2, TeleOCR, dots.mocr, DeepSeek-OCR 2, Chandra OCR 2, Unlimited OCR 2, olmOCR 2, OCRia-1, Qwen3-VL, Gemini 3 Pro |
| Layout detector + VLM (pipeline) | 5 | PaddleOCR-VL-1.6, GLM-OCR, MiniCPM-OCR 1.0, Xiaomi-OCR-0, MinerU2.5-Pro |
| Classic OCR engine (no VLM) | 2 | PP-OCRv6, Tesseract |
| Not disclosed (closed service) | 2 | Mistral OCR 4, Azure DI / Content Understanding |

Some notes on the edge cases:

- 4 of the 5 pipeline models use the same detector, Baidu's PP-DocLayoutV3:
  PaddleOCR-VL, GLM-OCR, MiniCPM-OCR and Xiaomi-OCR-0.
- MinerU2.5-Pro is two-stage, but one model does both steps: it finds the layout
  first, then reads the crops.
- Xiaomi-OCR-0 can also run end-to-end. Its best scores come from the pipeline
  setup.
- VLM alone doesn't mean no boxes. TeleOCR, dots.mocr, LightOnOCR-3 and Chandra
  2 were trained to output boxes themselves. OvisOCR2 and olmOCR 2 don't.
- OCRia-1 and Gemini 3 Pro are closed, so their category is inferred from how
  they're described, not confirmed.

### Parameters count

| Size tier | Models (params) |
| --- | --- |
| Tiny (< 0.1B) | PP-OCRv6 (1.5M / 7.7M / 34.5M), Tesseract (n/a, LSTM engine) |
| Small (0.8–1.3B) | OvisOCR2 (0.8B), Xiaomi-OCR-0 (0.8B), PaddleOCR-VL-1.6 (0.9B), GLM-OCR (0.9B), TeleOCR (1.2B), MinerU2.5-Pro (1.2B), MiniCPM-OCR 1.0 (1.3B, +2B Jev checker), LightOnOCR-3 (0.8B / 1B) |
| Medium (3–4B) | dots.mocr (3B), DeepSeek-OCR 2 (~3B MoE), Unlimited OCR 2 (3.34B MoE, ~0.5B active), Chandra OCR 2 (4B; 5.3B on HF), OCRia-1 (4B), LightOnOCR-3 (4B) |
| Large (7B+) | olmOCR 2 (7B), Qwen3-VL (235B MoE, 22B active) |
| Not disclosed | Mistral OCR 4, Azure DI / CU, Gemini 3 Pro |

### Output

16 out of 20 output text + bounding boxes

## The options

### 1. PaddleOCR-VL-1.6 (open model)

- **Released:** 28 May 2026
- **GitHub source:**
  [PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
- **Hugging Face source:**
  [PaddlePaddle/PaddleOCR-VL-1.6](https://huggingface.co/PaddlePaddle/PaddleOCR-VL-1.6)
- **Release publication:** PaddleOCR-VL-1.6 technical report, arXiv 2606.03264
  (3 Jun 2026); [release notes
  v3.6.0](https://github.com/paddlepaddle/PaddleOCR/releases)
- **Benchmark results:** OmniDocBench v1.6 96.34; Real5-OmniDocBench 93.19; Wild
  87.36
- **LinkedIn post:** none found
- **Company/group:** Baidu, PaddlePaddle team
- **Parameter count:** 0.9B VLM + PP-DocLayoutV3 layout model
- **Output:** text + bbox (Markdown and JSON with layout boxes, polygons for
  warped pages, `spotting` mode for line boxes)
- **License:** Apache 2.0
- **FertiScan note:** best verified score on photographed pages; 109 languages

### 2. LightOnOCR-3 (open model) (new)

- **Released:** 8 Oct 2026
- **GitHub source:**
  [lightonai/LightOnOCR](https://github.com/lightonai/LightOnOCR)
- **Hugging Face source:**
  [lightonai/LightOnOCR-3-4B](https://huggingface.co/lightonai/LightOnOCR-3-4B)
  (also 1B and 0.8B variants)
- **Release publication:** [LightOn blog post on Hugging
  Face](https://huggingface.co/blog/lightonai/lightonocr-3); [press
  release](https://www.webdisclosure.com/press-release/lighton-releases-lightonocr-3-a-world-leading-model-family-for-document-intelligence-daiIusgdpjY)
- **Benchmark results:** olmOCR-Bench 86.3 (4B), 85.5 (0.8B), 84.5 (1B);
  ParseBench 75.1 (4B); French fr-bench-pdf2md 71.4 (4B, LlamaIndex's run;
  LightOn self-reports: 74.1)
- **LinkedIn post:** none found as a direct post; LightOn links its LinkedIn
  page from the model card
- **Company/group:** LightOn (Paris)
- **Parameter count:** 0.8B / 1B / 4B
- **Output:** text + bbox (empty prompt gives Markdown; `grounding` prompt gives
  labelled blocks with boxes, 0 to 1000)
- **License:** Apache 2.0
- **FertiScan note:** strong French-document score; managed API on Scaleway
  (EU); weak on handwriting

### 3. GLM-OCR (open model)

- **Released:** 3 Feb 2026
- **GitHub source:** [zai-org/GLM-OCR](https://github.com/zai-org/GLM-OCR)
- **Hugging Face source:**
  [zai-org/GLM-OCR](https://huggingface.co/zai-org/GLM-OCR)
- **Release publication:** [GLM-OCR Technical
  Report](https://arxiv.org/html/2603.10910)
- **Benchmark results:** OmniDocBench v1.6 95.22; v1.5 94.62; Real5 90.32; Wild
  85.08; 1.86 PDF pages/s (Z.ai)
- **LinkedIn post:** none found (Z.ai announced on
  [X](https://x.com/Zai_org/status/2018520063175717010)).
- **Company/group:** Z.ai (Zhipu AI)
- **Parameter count:** 0.9B (0.4B CogViT encoder + 0.5B GLM decoder)
- **Output:** text + bbox (layout stage in the SDK); can also fill a JSON schema
  you provide
- **License:** MIT; layout component Apache 2.0
- **FertiScan note:** schema mode could replace part of the LLM form-filling
  step

### 4. MiniCPM-OCR 1.0 + Jev (open model) (new)

- **Released:** 27 Oct 2026
- **GitHub source:**
  [OpenBMB/MiniCPM-OCR](https://github.com/OpenBMB/MiniCPM-OCR)
- **Hugging Face source:**
  [openbmb/MiniCPM-OCR-1.0](https://huggingface.co/openbmb/MiniCPM-OCR-1.0);
  checker
  [openbmb/MiniCPM-OCR-1.0-Jev](https://huggingface.co/openbmb/MiniCPM-OCR-1.0-Jev)
- **Release publication:** [MiniCPM-OCR repository and release
  information](https://github.com/OpenBMB/MiniCPM-OCR)
- **Benchmark results:** Real5-OmniDocBench 93.68 (self-reported); OCRBench v2
  54.7; ~1.49x PaddleOCR-VL-1.6 throughput; Jev AUROC 93.6 on JevOCRBench
- **LinkedIn post:** none found ([OpenBMB on X, via
  AGTP](https://x.com/AGTPinsights/status/2115159198338293806))
- **Company/group:** OpenBMB / ModelBest
- **Parameter count:** 1.3B; Jev checker 2B
- **Output:** text + bbox (PP-DocLayoutV3 layout detection, then Markdown or
  JSON); Jev outputs a 0 to 1 quality score per region
- **License:** Apache 2.0 (code and weights)
- **FertiScan note:** strong on photos; officially Chinese and English only, but
  the repo includes a French fine-tuning guide

### 5. Xiaomi-OCR-0 (open model) (new)

- **Released:** late Oct 2026 (public leaderboard discussion opened 30 Oct)
- **GitHub source:** released on GitHub per Xiaomi's announcement (repository
  link not verified)
- **Hugging Face source:**
  [SeerRay-Lab/Xiaomi-OCR-0](https://huggingface.co/SeerRay-Lab/Xiaomi-OCR-0)
- **Release publication:** [technical report, arXiv
  2609.36136](https://arxiv.org/abs/2609.36136)
- **Benchmark results:** Real5-OmniDocBench 95.24 (self-reported; 92.73 on the
  public leaderboard, behind PaddleOCR-VL-1.6); OmniDocBench v1.6 96.83
  (self-reported, not on the official board); OCR VQA average 83.2
- **LinkedIn post:** none found
- **Company/group:** Xiaomi
- **Parameter count:** 0.8B (Qwen3.5-0.8B base)
- **Output:** text + bbox when run in its reported two-stage setup
  (PP-DocLayoutV3 layout boxes, then recognition); Markdown, tables as OTSL,
  LaTeX formulas, JSON fields
- **License:** Apache 2.0
- **FertiScan note:** promising for photos and field extraction; headline scores
  depend on Xiaomi's own evaluation setup, so test before trusting them

### 6. Mistral OCR 4 / 4.1 (hosted API)

- **Released:** 23 Jun 2026 (OCR 4); 16 Jul 2026 (4.1 preview)
- **GitHub source:** n/a (closed model)
- **Hugging Face source:** n/a
- **Release publication:** [Mistral OCR 4
  announcement](https://mistral.ai/news/ocr-4); [OCR 4.1
  preview](https://runtimewire.com/article/mistral-ocr-4-1-block-confidence-document-ai)
- **Benchmark results:** olmOCR-Bench 85.20 and OmniDocBench 93.07
  (self-reported, version unstated); ParseBench 67.5 to 68.2 (4.1, per LightOn
  and LlamaIndex)
- **LinkedIn post:** none found (Mistral announced on X, 23 Jun 2026)
- **Company/group:** Mistral AI
- **Parameter count:** not disclosed
- **Output:** text + bbox (paragraph-level boxes, block labels, page and word
  confidence scores)
- **License:** closed API; enterprise self-hosting available; $4 per 1,000 pages
  ($2 batch)
- **FertiScan note:** richest structured output; also available on Microsoft
  Foundry

### 7. Azure Document Intelligence / Content Understanding (hosted API)

- **Released:** ongoing service; DI v4.0 GA; Content Understanding 2.0 preview
  Aug 2026
- **GitHub source:** n/a (closed service)
- **Hugging Face source:** n/a
- **Release publication:** [Content Understanding what's
  new](https://learn.microsoft.com/en-ca/Azure/ai-services/content-understanding/whats-new);
  [Aug 2026
  update](https://devblogs.microsoft.com/foundry/azure-content-understanding-updates-august-2026)
- **Benchmark results:** no public OmniDocBench or olmOCR-Bench row
- **LinkedIn post:** none found
- **Company/group:** Microsoft
- **Parameter count:** not disclosed
- **Output:** text + bbox (words, lines and tables with polygons and confidence)
- **License:** closed API
- **FertiScan note:** Microsoft now points new work
  to Content Understanding

### 8. OCRia-1 (hosted model) (new)

- **Released:** ~22 Oct 2026
- **GitHub source:** n/a (weights not released)
- **Hugging Face source:** n/a
- **Release publication:** [Introducing
  OCRia-1](https://www.llamaindex.ai/blog/parse-ocria-1); [technical
  report](https://www.llamaindex.ai/ocria/ocria-1-technical-report.pdf) (arXiv
  2611.00092)
- **Benchmark results:** ParseBench 87.4 (LlamaIndex's own benchmark);
  olmOCR-Bench 83.5 overall, 92.9 on tables; PulseBench-Tab 84.1; French
  fr-bench-pdf2md 72.1
- **LinkedIn post:** none found as a direct post
- **Company/group:** LlamaIndex
- **Parameter count:** 4B (Qwen3.5-4B base)
- **Output:** text only as documented (Markdown and HTML, tables, charts as data
  tables, LaTeX); box output not stated in the announcement
- **License:** proprietary; available through LlamaParse and OpenDocRouter
- **FertiScan note:** best reported tables, which suits guaranteed-analysis
  tables, but hosted only and most scores are vendor-run

### 9. dots.mocr (open model)

- **Released:** 13 Mar 2026
- **GitHub source:**
  [rednote-hilab/dots.mocr](https://github.com/rednote-hilab/dots.mocr)
- **Hugging Face source:**
  [rednote-hilab/dots.mocr](https://huggingface.co/rednote-hilab/dots.mocr)
- **Release publication:** [Multimodal OCR: Parse Anything from
  Documents](https://arxiv.org/abs/2603.13032), arXiv
- **Benchmark results:** olmOCR-Bench 83.9 (self-reported); MDPBench 80.5;
  predecessor dots.ocr 90.77 on OmniDocBench v1.6
- **LinkedIn post:** none found
- **Company/group:** rednote hi lab (Xiaohongshu)
- **Parameter count:** 3B
- **Output:** text + bbox (JSON with layout boxes and text, plus Markdown;
  charts and icons as SVG)
- **License:** MIT plus its own agreement
- **FertiScan note:** solid multilingual alternative if the top picks disappoint

### 10. TeleOCR (open model)

- **Released:** 17 Aug 2026 (as NaviDC-OCR; renamed 10 Sep 2026)
- **GitHub source:** [caipeng328/TeleOCR](https://github.com/caipeng328/TeleOCR)
  (not under an organization; likely the official repository)
- **Hugging Face source:**
  [XingChen-AGI/TeleOCR](https://huggingface.co/XingChen-AGI/TeleOCR)
- **Release publication:** TeleOCR: Navigating Document Parsing Across Digital
  and Camera-Captured Documents, arXiv 2608.12898
- **Benchmark results:** OmniDocBench v1.6 96.87 (#1 among permissively licensed
  models on the official board)
- **LinkedIn post:** none found
- **Company/group:** China Telecom (XingChen-AGI)
- **Parameter count:** ~1.2B (Qwen2.5-VL based)
- **Output:** text + bbox (layout boxes; tables as OTSL converted to HTML;
  formulas in LaTeX)
- **License:** Apache 2.0 on the card, but a [third-party
  conversion](https://huggingface.co/cstr/TeleOCR-GGUF) flags inherited Qwen
  terms
- **FertiScan note:** built for camera-captured, warped pages; verify the
  license first

### 11. OvisOCR2 (open model)

- **Released:** 15 Jul 2026
- **GitHub source:** none official
- **Hugging Face source:**
  [ATH-MaaS/OvisOCR2](https://huggingface.co/ATH-MaaS/OvisOCR2)
- **Release publication:** [OvisOCR2 Technical
  Report](https://arxiv.org/abs/2607.13639), arXiv
- **Benchmark results:** OmniDocBench v1.6 96.47 (board) / 96.58
  (self-reported); PureDocBench 75.06; Real5 92.29; Wild 87.91
- **LinkedIn post:** none found
- **Company/group:** Alibaba, Ovis team
- **Parameter count:** 0.8B (Qwen3.5-0.8B base)
- **Output:** text only, except image/chart regions get bbox (0 to 1000); one
  Markdown file per page
- **License:** Apache 2.0
- **FertiScan note:** cheapest top model to run, but text cannot be traced back
  to a location

### 12. PP-OCRv6 (classic engine)

- **Released:** 11 Jun 2026
- **GitHub source:**
  [PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
- **Hugging Face source:** none listed in sources reviewed (distributed through
  PaddleOCR)
- **Release publication:** [PaddleOCR v3.7.0 release
  notes](https://github.com/PaddlePaddle/PaddleOCR/releases/tag/v3.7.0)
- **Benchmark results:** +4.6% detection and +5.1% recognition vs
  PP-OCRv5_server (Baidu); 1.40 s per image on Xeon CPU with OpenVINO; not on
  page-parsing leaderboards
- **LinkedIn post:** none found
- **Company/group:** Baidu, PaddlePaddle team
- **Parameter count:** 1.5M (tiny) / 7.7M (small) / 34.5M (medium)
- **Output:** text + bbox (line boxes)
- **License:** Apache 2.0
- **FertiScan note:** best CPU fallback; one model covers 50 languages including
  French

### 13. MinerU2.5-Pro (open model)

- **Released:** May 2026 (MinerU 4 toolkit Sep 2026)
- **GitHub source:** [opendatalab/MinerU](https://github.com/opendatalab/MinerU)
- **Hugging Face source:**
  [opendatalab/MinerU2.5-Pro-2605-1.2B](https://huggingface.co/opendatalab/MinerU2.5-Pro-2605-1.2B)
- **Release publication:** model card
- **Benchmark results:** OmniDocBench v1.6 95.75
- **LinkedIn post:** none found
- **Company/group:** OpenDataLab, Shanghai AI Laboratory (also maintains
  OmniDocBench)
- **Parameter count:** 1.2B
- **Output:** text + bbox (JSON with block coordinates, converted to Markdown)
- **License:** weights Apache 2.0; MinerU toolkit adds revenue thresholds and
  attribution
- **FertiScan note:** tuned for PDFs and papers more than photos

### 14. Gemini 3 Pro (hosted API)

- **Released:** 2025
- **GitHub source:** n/a
- **Hugging Face source:** n/a
- **Release publication:** Google model card
- **Benchmark results:** OmniDocBench v1.6 92.91; Real5 89.24; MDPBench 86.4
  (top on photographed and multilingual pages)
- **LinkedIn post:** none found
- **Company/group:** Google DeepMind
- **Parameter count:** not disclosed
- **Output:** text; bbox via prompting
- **License:** closed API
- **FertiScan note:** strong reference point for photos, but behind small open
  models on clean pages

### 15. DeepSeek-OCR 2 (open model)

- **Released:** 27 Jan 2026
- **GitHub source:**
  [deepseek-ai/DeepSeek-OCR-2](https://github.com/deepseek-ai/DeepSeek-OCR-2)
- **Hugging Face source:**
  [deepseek-ai/DeepSeek-OCR-2](https://huggingface.co/deepseek-ai/DeepSeek-OCR-2)
- **Release publication:** [DeepSeek-OCR 2: Visual Causal
  Flow](https://github.com/deepseek-ai/DeepSeek-OCR-2/blob/main/DeepSeek_OCR2_paper.pdf),
  arXiv 2601.20552
- **Benchmark results:** OmniDocBench v1.6 90.25; v1.5 91.09
- **LinkedIn post:** none found ([release
  coverage](https://comfyui-wiki.com/en/news/2026-01-27-deepseek-ocr-2-release))
- **Company/group:** DeepSeek
- **Parameter count:** ~3B MoE
- **Output:** text + bbox (grounded Markdown)
- **License:** Apache 2.0 per model card (verify; some listings cite the
  DeepSeek license)
- **FertiScan note:** optimized for long documents and token compression, less
  relevant for single labels

### 16. Chandra OCR 2 (open model)

- **Released:** 18 Mar 2026
- **GitHub source:** [datalab-to/chandra](https://github.com/datalab-to/chandra)
- **Hugging Face source:**
  [datalab-to/chandra-ocr-2](https://huggingface.co/datalab-to/chandra-ocr-2)
- **Release publication:** [Datalab blog: Chandra
  2](https://www.datalab.to/blog/chandra-2); [GitHub
  release](https://github.com/datalab-to/chandra/releases)
- **Benchmark results:** olmOCR-Bench 85.9 (self-reported; hosted API 86.7);
  43-language average 77.8; ParseBench 70.1 to 74.8 depending on who ran it
- **LinkedIn post:** none found (founder [Vik Paruchuri's
  LinkedIn](https://www.linkedin.com/in/vikparuchuri))
- **Company/group:** Datalab (Brooklyn; makers of Marker and Surya)
- **Parameter count:** 4B per release notes (5.3B listed on Hugging Face)
- **Output:** text + bbox (Markdown, HTML or JSON; 15+ layout block types with
  boxes)
- **License:** code Apache 2.0; weights modified OpenRAIL-M, free only under $2M
  revenue/funding
- **FertiScan note:** strong on tables and handwriting, but the license likely
  rules it out

### 17. Unlimited OCR 2 (open model) (new)

- **Released:** 27 Oct 2026 (paper on arXiv 2 Nov 2026)
- **GitHub source:**
  [baidu/Unlimited-OCR](https://github.com/baidu/Unlimited-OCR)
- **Hugging Face source:**
  [baidu/Unlimited-OCR-2](https://huggingface.co/baidu/Unlimited-OCR-2)
- **Release publication:** Unlimited OCR Works 2 (arXiv, 2 Nov 2026); v1 paper
  [Unlimited OCR Works](https://arxiv.org/pdf/2606.23050)
- **Benchmark results:** MarathonDocBench 77.1 and MPDocBench 84.6 (Baidu's own
  benchmarks); v1 scored 93.92 on OmniDocBench v1.6 (self-reported) and 46.17 on
  ParseBench (third-party)
- **LinkedIn post:** none found ([Baidu ERNIE team on X, via
  AGTP](https://x.com/AGTPinsights/status/2114970339533050222))
- **Company/group:** Baidu, ERNIE team
- **Parameter count:** 3.34B MoE (~0.5B active)
- **Output:** text + bbox (tagged layout boxes, 0 to 999; documented for v1)
- **License:** MIT
- **FertiScan note:** built for 100+ page documents; not a fit for single-panel
  labels

### 18. Qwen3-VL-235B (open general VLM)

- **Released:** Sep 2025
- **GitHub source:** [QwenLM/Qwen3-VL](https://github.com/QwenLM/Qwen3-VL)
- **Hugging Face source:**
  [Qwen/Qwen3-VL-235B-A22B-Instruct](https://huggingface.co/Qwen/Qwen3-VL-235B-A22B-Instruct)
- **Release publication:** [Qwen3-VL Technical
  Report](https://arxiv.org/pdf/2511.21631)
- **Benchmark results:** OmniDocBench v1.6 89.78; Real5 88.90
- **LinkedIn post:** none found
- **Company/group:** Alibaba, Qwen team
- **Parameter count:** 235B MoE (22B active)
- **Output:** text + bbox (native grounding, weaker when asked for text and
  boxes in one pass)
- **License:** Apache 2.0
- **FertiScan note:** far too large for this job; base model for several smaller
  OCR models

### 19. olmOCR 2 (open model)

- **Released:** Oct 2025
- **GitHub source:** [allenai/olmocr](https://github.com/allenai/olmocr)
- **Hugging Face source:**
  [allenai/olmOCR-2-7B-1025-FP8](https://huggingface.co/allenai/olmOCR-2-7B-1025-FP8)
- **Release publication:** [olmOCR 2: Unit Test Rewards for Document
  OCR](https://arxiv.org/abs/2510.19817)
- **Benchmark results:** olmOCR-Bench 82.4; OmniDocBench v1.6 85.74
- **LinkedIn post:** none found
- **Company/group:** Allen Institute for AI (Ai2)
- **Parameter count:** 7B (fine-tuned from Qwen2.5-VL-7B)
- **Output:** text only (Markdown; headers and footers removed on purpose)
- **License:** Apache 2.0, with research and educational use guidance
- **FertiScan note:** not recommended; no boxes, and dropping headers can lose
  label fields

### 20. Tesseract 5.5.x (classic engine)

- **Released:** long-running project; 5.5.3 (Jul 2026), 5.5.4 (Oct 2026)
- **GitHub source:**
  [tesseract-ocr/tesseract](https://github.com/tesseract-ocr/tesseract)
- **Hugging Face source:** n/a
- **Release publication:** GitHub releases
- **Benchmark results:** not on modern leaderboards; weak on tables, poor scans
  and handwriting
- **LinkedIn post:** n/a
- **Company/group:** open-source community (originally HP, later Google)
- **Parameter count:** n/a (LSTM engine)
- **Output:** text + bbox (word boxes via hOCR, TSV, ALTO, PAGE)
- **License:** Apache 2.0
- **FertiScan note:** baseline only

## Comparison

| Rank | Model | Released | Type | Params | Output | License | Headline benchmark |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | PaddleOCR-VL-1.6 | May 2026 | Open model | 0.9B | Text + bbox | Apache 2.0 | OmniDocBench v1.6 96.34; Real5 93.19 |
| 2 | LightOnOCR-3 (new) | Oct 2026 | Open model | 0.8B / 1B / 4B | Text + bbox | Apache 2.0 | olmOCR-Bench 86.3; FR bench 71.4 |
| 3 | GLM-OCR | Feb 2026 | Open model | 0.9B | Text + bbox | MIT | OmniDocBench v1.6 95.22 |
| 4 | MiniCPM-OCR 1.0 (new) | Oct 2026 | Open model | 1.3B (+2B Jev) | Text + bbox | Apache 2.0 | Real5 93.68 (self-reported) |
| 5 | Xiaomi-OCR-0 (new) | Oct 2026 | Open model | 0.8B | Text + bbox (two-stage) | Apache 2.0 | Real5 92.73 (public) / 95.24 (self) |
| 6 | Mistral OCR 4 / 4.1 | Jun 2026 | Hosted API | Not disclosed | Text + bbox + confidence | Closed | olmOCR-Bench 85.20 (self-reported) |
| 7 | Azure DI / CU | Ongoing | Hosted API | Not disclosed | Text + bbox + confidence | Closed | No public score |
| 8 | OCRia-1 (new) | Oct 2026 | Hosted model | 4B | Text (boxes not stated) | Proprietary | ParseBench 87.4 (own benchmark) |
| 9 | dots.mocr | Mar 2026 | Open model | 3B | Text + bbox | MIT + agreement | olmOCR-Bench 83.9 |
| 10 | TeleOCR | Aug 2026 | Open model | 1.2B | Text + bbox | Apache 2.0 (verify) | OmniDocBench v1.6 96.91 |
| 11 | OvisOCR2 | Jul 2026 | Open model | 0.8B | Text (image-region boxes only) | Apache 2.0 | OmniDocBench v1.6 96.47 |
| 12 | PP-OCRv6 | Jun 2026 | Classic engine | 1.5M to 34.5M | Text + line bbox | Apache 2.0 | Not on page boards |
| 13 | MinerU2.5-Pro | May 2026 | Open model | 1.2B | Text + bbox | Apache 2.0 + toolkit terms | OmniDocBench v1.6 95.75 |
| 14 | Gemini 3 Pro | 2025 | Hosted API | Not disclosed | Text(bbox via prompting) | Closed | OmniDocBench v1.6 92.91; MDPBench 86.4 |
| 15 | DeepSeek-OCR 2 | Jan 2026 | Open model | ~3B MoE | Text + bbox | Apache 2.0 (verify) | OmniDocBench v1.6 90.25 |
| 16 | Chandra OCR 2 | Mar 2026 | Open model | 4B | Text + bbox | OpenRAIL-M (revenue cap) | olmOCR-Bench 85.9 |
| 17 | Unlimited OCR 2 (new) | Oct 2026 | Open model | 3.34B MoE | Text + bbox | MIT | MarathonDocBench 77.1 (own) |
| 18 | Qwen3-VL-235B | Sep 2025 | Open general VLM | 235B MoE | Text + bbox | Apache 2.0 | OmniDocBench v1.6 89.78 |
| 19 | olmOCR 2 | Oct 2025 | Open model | 7B | Text only | Apache 2.0 | olmOCR-Bench 82.4 |
| 20 | Tesseract 5.5.x | Ongoing | Classic engine | n/a | Text + word bbox | Apache 2.0 | Not benchmarked |

OmniDocBench, olmOCR-Bench, Real5 and ParseBench use different pages and
scoring, so scores across them cannot be compared.

### What the benchmarks measure

| Benchmark | What it tests | Why it matters here |
| --- | --- | --- |
| [OmniDocBench v1.6](https://github.com/opendatalab/OmniDocBench) | 1,651 clean PDF pages; text, tables, formulas, reading order | Main leaderboard, but a third of the score is formulas, which labels lack |
| [olmOCR-Bench](https://huggingface.co/datasets/allenai/olmOCR-bench) | 7,010 pass/fail tests on 1,403 English PDFs | Rewards dropping headers and footers; English only |
| [Real5-OmniDocBench](https://arxiv.org/abs/2603.04205) | Same pages, physically scanned, warped, screen-photographed, lit unevenly, skewed | Closest proxy for phone photos; built by the PaddleOCR team |
| [Wild-OmniDocBench](https://github.com/VirtualLUOUCAS/Wild_OmniDocBench) | Printed, bent and photographed pages | Same idea, independent authors |
| [MDPBench](https://github.com/Yuliang-Liu/MultimodalOCR/tree/main/MDPBench) | 3,400 images, 17 languages, digital and photographed | Open models drop 17.8% on photos |
| [ParseBench](https://huggingface.co/datasets/llamaindex/ParseBench) | 2,000 pages with a visual-grounding category | Scores box quality; made by LlamaIndex, which also makes OCRia-1 |

## Limitations

- **No benchmark contains product labels or packaging.** All public boards use
  PDFs, papers, books and reports.
- **Photos cost points.** Top models drop 5 to 10 points from clean pages to
  photographed ones (e.g. PaddleOCR-VL-1.6: Real5 93.19, Wild 87.36; GLM-OCR:
  Real5 90.32, Wild 85.08). Earlier models fell further: the first PaddleOCR-VL
  went from 91.93 to 72.19 on Wild.
- **Many scores are self-reported** by the model makers, and several benchmarks
  are run by groups whose own models top them (OmniDocBench and MinerU, Real5
  and PaddleOCR-VL, ParseBench and OCRia-1).
- **Self-reported and public scores can differ.** Xiaomi-OCR-0 reports 95.24 on
  Real5, but the public leaderboard shows 92.73.
- **The newest models have little outside testing.** The five releases from the
  past few weeks have mostly vendor-run numbers so far.
- **Benchmark versions are not comparable**; a v1.5 score and a v1.6 score are
  different exams.
- **French coverage is thin.** Only LightOnOCR-3 and OCRia-1 publish French
  scores for themselves; a few others were scored on French documents by LlamaIndex.
- **Licenses change often.** Check each repository's LICENSE file before
  committing.
- **No LinkedIn posts could be verified** for any model; official X posts and
  press releases are linked instead.

## Sources

- [OCR Benchmarks 2026, Invoice Data
  Extraction](https://invoicedataextraction.com/blog/ocr-benchmarks),
  leaderboards read 21 Oct 2026
- [Best OCR models in 2026,
  Docsumo](https://www.docsumo.com/blog/best-ocr-models), checked 29 Sep 2026
- [10 best open source OCR tools,
  Koncile](https://www.koncile.ai/en/ressources/10-open-source-ocr-tools-you-should-know-about),
  updated 2 Nov 2026
- [LightOnOCR-3 review,
  explainx](https://explainx.ai/blog/lightonocr-3-parsebench-open-weight-ocr-2026)
- [Mistral OCR 4 announcement](https://mistral.ai/news/ocr-4)
- [Mistral OCR 4.1
  preview](https://runtimewire.com/article/mistral-ocr-4-1-block-confidence-document-ai)
- [PaddleOCR-VL-1.6 model
  card](https://huggingface.co/PaddlePaddle/PaddleOCR-VL-1.6)
- [PP-OCRv6 release
  notes](https://github.com/PaddlePaddle/PaddleOCR/releases/tag/v3.7.0)
- [GLM-OCR technical report](https://arxiv.org/html/2603.10910)
- [OvisOCR2 technical report](https://arxiv.org/abs/2607.13639)
- [TeleOCR model card](https://huggingface.co/XingChen-AGI/TeleOCR) and [license
  note](https://huggingface.co/cstr/TeleOCR-GGUF)
- [Chandra OCR 2 release](https://github.com/datalab-to/chandra/releases)
- [dots.mocr paper](https://arxiv.org/html/2603.13032)
- [DeepSeek-OCR 2
  release](https://comfyui-wiki.com/en/news/2026-01-27-deepseek-ocr-2-release)
- [MiniCPM-OCR repository](https://github.com/OpenBMB/MiniCPM-OCR)
- [Unlimited OCR repository](https://github.com/baidu/Unlimited-OCR) and
  [Unlimited OCR 2 model card](https://huggingface.co/baidu/Unlimited-OCR-2)
- [Unlimited OCR (v1) box
  format](https://huggingface.co/FluidInference/unlimited-ocr-mlx-coreml)
- [Xiaomi-OCR-0 model card](https://huggingface.co/SeerRay-Lab/Xiaomi-OCR-0) and
  [technical report](https://arxiv.org/abs/2609.36136)
- [OCRia-1 announcement](https://www.llamaindex.ai/blog/parse-ocria-1) and
  [technical
  report](https://www.llamaindex.ai/ocria/ocria-1-technical-report.pdf)
- [Azure Content Understanding
  updates](https://devblogs.microsoft.com/foundry/azure-content-understanding-updates-august-2026)
