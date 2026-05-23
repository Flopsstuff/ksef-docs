# OpenRouter Free Models — Translation Benchmark (KSeF)

Test: `yarn check` (translate one Polish sentence into EN/RU/UK), 3 runs per model, provider `openrouter`.

| # | Model | Success | Time, ms (3 runs) | Translation quality | Verdict |
|---|-------|---------|-------------------|---------------------|---------|
| 1 | nvidia/nemotron-3-super-120b-a12b:free | 3/3 ✅ | 23363 / 18676 / 7502 | Good, correct term "счетов-фактур" | Stable, but slow and jittery latency |
| 2 | nvidia/nemotron-3-nano-30b-a3b:free | 3/3 ✅ | 3085 / 1836 / 2241 | Medium: glued words ("Theinvoice", "receivedby"), calque "Фактура", inconsistent term | Fast, but artifacts |
| 3 | nvidia/nemotron-nano-9b-v2:free | 3/3 ⚠️ | 9818 / 13168 / 9647 | Empty — burns all 512 tokens on reasoning | Unusable |
| 4 | openai/gpt-oss-20b:free | 3/3 ✅ | 10306 / 8982 / 17095 | Good, stable, adds "(KSeF)" clarification | Reliable |
| 5 | google/gemma-4-26b-a4b-it:free | 0/3 ❌ | — (429) | — | Unavailable (429) |
| 6 | google/gemma-4-31b-it:free | 1/3 ⚠️ | 3486 (+2×429) | Good when it answers | Unstable |
| 7 | meta-llama/llama-3.2-3b-instruct:free | 0/3 ❌ | — (429, ~52s) | — | Unavailable (429) |
| 8 | liquid/lfm-2.5-1.2b-instruct:free | 3/3 ✅ | 1242 / 1004 / 1275 | Poor: RU "Файл… Национальным системой" (errors), UK line in English | Fast, but unusable |
| 9 | cognitivecomputations/dolphin-mistral-24b-venice-edition:free | 0/3 ❌ | — (429, ~50s) | — | Unavailable (429) |
| 10 | minimax/minimax-m2.5:free | 1/3 ⚠️ | 15747 (+2×429) | Good when it answers | Unstable |
| 11 | qwen/qwen3-next-80b-a3b-instruct:free | 0/3 ❌ | — (429, ~55s) | — | Unavailable (429) |
| 12 | qwen/qwen3-coder:free | 0/3 ❌ | — (429, ~51s) | — | Unavailable (429) |
| 13 | nousresearch/hermes-3-llama-3.1-405b:free | 0/3 ❌ | — (429, ~51s) | — | Unavailable (429) |
| 14 | z-ai/glm-4.5-air:free | 3/3 ✅ | 8264 / 9803 / 18772 | Best: "Счёт-фактура была успешно принята… счетов-фактур", identical across all 3 runs | Reliable |
| 15 | openai/gpt-oss-120b:free | 3/3 ✅ | 5440 / 4222 / 7360 | Good and fast, but leaves "e-Invoice" untranslated in 2/3 runs; RU gender drifts ("принята"/"принят") | Reliable, fastest of the good ones |

## Top 5

1. **z-ai/glm-4.5-air:free** — best balance. 3/3 with no errors, the most accurate and idiomatic RU/UK translation (correct term "счёт-фактура"), fully reproducible, 8–19 s.
2. **openai/gpt-oss-120b:free** — fastest reliable option (4–7 s), 3/3, good quality. Caveat: occasionally leaves "e-Invoice" untranslated and RU gender drifts.
3. **openai/gpt-oss-20b:free** — stable 3/3, fully translated output (no English leakage), but slower (9–17 s). Solid fallback for 429s.
4. **nvidia/nemotron-3-super-120b-a12b:free** — good, fully translated quality and 3/3, but slow with highly variable latency (7–23 s).
5. **nvidia/nemotron-3-nano-30b-a3b:free** — very fast (2–3 s) and 3/3, but quality is only fair: glued words and inconsistent terminology. Use only when speed trumps polish.
