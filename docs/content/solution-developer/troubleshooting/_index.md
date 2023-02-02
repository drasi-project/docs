---
type: "docs"
title: "Troubleshooting"
linkTitle: "Troubleshooting"
weight: 70
description: >
    Troubleshooting Drasi Issues
---

## Debug Reactor
Coming Soon...

## Known Issues

### Source / Continuous Query Race Condition
**Issue**: If you create a Source and create a Continuous Query that uses that Source before the Source has had a chance to connected to the source system correctly, the Continuous Query will be in a broken state because it could not bootstrap, and there is currently no bootstrap retry mechanism.

**Resolution**: Delete the Continuous Query and re-create it.