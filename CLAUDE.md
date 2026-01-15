# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a Flux CD GitOps repository managing a home lab Kubernetes cluster running on MicroK8s. All infrastructure is declaratively defined and automatically synced from the `main` branch.

## Architecture

**GitOps Flow**: Git commit → Push to main → Flux detects changes (1-10 min interval) → Auto-deploy

**Namespace Organization**:
- `flux-system/` - Core Flux CD components and GitRepository sync
- `flux-system-sources/` - HelmRepository definitions for all chart sources
- `default-namespace/` - Application workloads (home-assistant, frigate, mosquitto, etc.)
- `cert-manager-namespace/` - SSL/TLS certificate management
- `ingress/` - NGINX ingress controller
- `longhorn-system/` - Distributed block storage
- `metallb-system/` - Bare metal load balancer
- `monitoring-namespace/` - Grafana monitoring

## Key Patterns

**HelmRelease Structure** (used for all deployments):
```yaml
apiVersion: helm.toolkit.fluxcd.io/v2beta1
kind: HelmRelease
metadata:
  name: <app>
  namespace: <namespace>
spec:
  interval: 5m0s
  chart:
    spec:
      # renovate: registryUrl=<registry-url>
      chart: <chart-name>
      version: '<semver-range>'
      sourceRef:
        kind: HelmRepository
        name: <repo-name>
        namespace: flux-system
  values:
    # Chart-specific configuration
```

**Service Exposure**:
- LoadBalancer services use MetalLB with `metallb.universe.tf/loadBalancerIPs` annotation
- Ingress uses NGINX with optional cert-manager TLS (Let's Encrypt)
- Domain: `leonmachado.com`

**Storage**: Longhorn is the primary StorageClass (`storageClass: longhorn`)

**Renovate Integration**: Charts include `# renovate: registryUrl=<url>` comments for automated dependency updates

## MicroK8s-Specific Configuration

Longhorn CSI requires custom kubelet path:
```yaml
csi:
  kubeletRootDir: /var/snap/microk8s/common/var/lib/kubelet
```

## Common Operations

There are no build/test commands - this is a pure configuration repository. Changes are deployed by committing and pushing to `main`.

**Validate YAML**: `kubectl apply --dry-run=client -f <file>`

**Check Flux status** (on cluster):
- `flux get sources git`
- `flux get helmreleases -A`
- `flux reconcile source git flux-system`

## Helm Repository Sources

Chart sources are defined in `flux-system-sources/`:
- `k8s-at-home-charts` - Community home automation charts
- `grafana-charts` - Grafana ecosystem
- `longhorn-charts` - Longhorn storage
- `metallb-charts` - MetalLB load balancer
- `jetstack` - cert-manager
- `ingress-nginx` - NGINX ingress controller
- `personal-charts` - Custom charts from `reydelleon/helm-charts`
