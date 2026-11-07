# Local AI

Ollama serves local text and image inference at
`http://open-webui-ollama.default.svc.cluster.local:11434`.
Open WebUI provides the testing interface at `https://ai.leonmachado.com`.

## Models and resources

| Model | Base | Use |
| --- | --- | --- |
| `ha-text` | `qwen3.5:9b-q4_K_M` | Home Assistant conversation and text prompts |
| `ha-vision` | `qwen3.5:9b-q4_K_M` | Camera snapshots and image prompts |

The text model uses a 4,096-token context; the vision model uses 16,384 tokens.
Both models use eight CPU threads. Ollama allows one
inference request at a time and keeps one model loaded for 30 minutes.
The model files use a 12 GiB Longhorn volume. The aliases share their base
model files; they do not duplicate model weights.

The [Qwen 3.5 9B Q4_K_M model](https://ollama.com/library/qwen3.5:9b-q4_K_M)
supports text and image input and downloads approximately 6.6 GB of model files.
Q4_K_M uses mixed 4-bit quantization for the language model weights; the vision
projector uses BF16. Ollama has a 16 GiB RAM limit shared by text and vision
inference. Model files are only part of the memory budget: context cache,
image processing, and runtime buffers also consume RAM. Keep the configured
context sizes and single-model concurrency, and verify peak memory with
representative prompts and images before increasing either. The deployment
uses CPU inference with up to eight CPU cores; response time depends on the
node CPU and prompt size.

Disable thinking for automation requests (`think: false`). Keep image descriptions
short; use images resized to 480 pixels wide for camera automations.

## Home Assistant

Use the existing LLM Vision Ollama provider with default model `ha-vision`.
For text conversation, add the Home Assistant Ollama integration with the
Ollama URL above and model `ha-text`. Home Assistant device control is
experimental; expose only the entities needed by the assistant.

Camera analysis actions specify the local model, a modest image width, and a
short output limit:

```yaml
action: llmvision.image_analyzer
data:
  provider: 01JP5ST5738ERH4959TNN7HHX4
  model: ha-vision
  image_entity:
    - camera.baby_cam_low
  message: >-
    Briefly describe what is clearly visible. Do not guess identities or
    details that cannot be seen. State uncertainty when appropriate.
  target_width: 480
  max_tokens: 96
response_variable: analysis
```

Use a camera entity appropriate to the automation. The action's response is
available to subsequent actions as `analysis.response_text`.
