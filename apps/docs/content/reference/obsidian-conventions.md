---
title: Obsidian conventions
description: A portable convention for linked notes, tags, aliases, and folders.
tags:
  - obsidian
  - writing
  - knowledge-graph
aliases:
  - Vault conventions
---

# Obsidian conventions

The `apps/docs/content` directory is a portable vault. You can open it in
Obsidian without a conversion step. Keep each concept in one note and connect
related concepts with wikilinks.

## Required note metadata

Every published note starts with YAML front matter:

```yaml
title: A clear title
description: One concise description
tags: [topic, area]
aliases: [Alternative name]
```

## Linking and tags

- Link notes with `[[folder/note]]` or `[[folder/note|Readable label]]`.
- Use lower-case, hyphen-free tags in front matter. The API preserves tags in
  the document index and the web app exposes them with `#` labels.
- Use aliases when a topic has common alternate names.

Back to [[getting-started/overview|Docs hybrid mode]].
