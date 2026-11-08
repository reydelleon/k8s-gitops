# Music Assistant

Music Assistant runs with host networking for LAN player discovery and a 5 GiB
Longhorn volume mounted at `/data`. The LAN interface is
`http://192.168.1.9:8095`.

Configure music sources and players through the Music Assistant interface.
Home Assistant connects through its Music Assistant integration using the LAN
URL. Public DNS and port forwarding are not required for this deployment.
