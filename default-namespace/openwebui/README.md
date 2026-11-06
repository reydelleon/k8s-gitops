# Local AI

Ollama serves local text and image inference at
`http://open-webui-ollama.default.svc.cluster.local:11434`.
Open WebUI provides the testing interface at `https://ai.leonmachado.com`.

## Models and resources

| Model | Base | Use |
| --- | --- | --- |
| `ha-text` | `llama3.2:3b` | Home Assistant conversation and text prompts |
| `ha-vision` | `qwen3-vl:2b` | Camera snapshots and image prompts |

Both models use a 4,096-token context and eight CPU threads. Ollama allows one
inference request at a time and keeps up to two models loaded for 30 minutes.
The model files use a 12 GiB Longhorn volume. The aliases share their base
model files; they do not duplicate model weights.

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
