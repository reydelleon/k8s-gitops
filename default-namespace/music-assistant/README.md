# Music Assistant

Music Assistant runs with host networking for LAN player discovery and a 5 GiB
Longhorn volume mounted at `/data`. The LAN interface is
`http://192.168.1.9:8095`.

## Alexa Music Skill provider

The HelmRelease installs the experimental
[`312-dev/ma-alexa-music-skill`](https://github.com/312-dev/ma-alexa-music-skill)
provider from revision `bd2c41399b690ced4e0c7e6f99b3ab660b610eca`.
An init container downloads the pinned source archive, verifies its SHA-256,
and copies the provider and skill icons into an ephemeral volume. The server
mounts that volume read-only inside its Python package. Startup requires access
to `codeload.github.com`. The mount path depends on the server image's Python
version and must be checked when upgrading the image.

The provider appears as **Alexa** in MA's player-provider list. Its domain is
`ma_alexa`; select the provider whose documentation points to `312-dev`, rather
than the built-in Alexa custom-skill provider.

The Alexa endpoint uses port `5056`, exposed through Traefik at
`https://alexa-music.leonmachado.com`. The ingress uses the existing
`homeassistant-tls` wildcard certificate. The MA UI and streaming ports are
available on the LAN. Amazon request-signature verification is enabled with
`VERIFY_REQUESTS=on`.

### Setup

1. Provide public DNS for `alexa-music.leonmachado.com` and route external TCP
   port 443 to Traefik. Amazon must be able to reach this endpoint over HTTPS.
2. In MA, add the `ma_alexa` player provider. Configure the public base URL as
   `https://alexa-music.leonmachado.com` and the endpoint port as `5056`.
3. Supply the Subsonic-compatible music server URL and credentials. This pinned
   provider requires its URL and username to start the endpoint. It also supports
   forwarding MA tracks from other providers, but those do not remove this
   startup requirement.
4. Complete the provider's Amazon account and developer authorization flows.
   Enter credentials directly in MA. Provider settings, generated secrets, and
   authorization state persist on the data volume; they do not belong in Git.
5. Select music providers for voice-search cataloging and complete the skill
   setup and catalog ingestion steps.
6. Enable **Expose Alexa speaker groups as players**. Define the speaker groups
   in the Alexa app, select a group in MA, and test playback on all its members.

Successful installation and provider discovery establish that its code loads.
Group playback requires a completed Amazon setup and an audible playback test.
