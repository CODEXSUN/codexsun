# Article Assets

Store an article image beside the article area that owns it. Use a child folder
when an article needs several files.

```text
assist/
  assets/
    architecture/
      deployment-flow.png
```

Reference an image from Markdown with a relative path:

```md
![Deployment flow](assets/architecture/deployment-flow.png)
```

Docs serves supported image files through its restricted asset route. Supported
formats are AVIF, GIF, JPEG, PNG, SVG, and WebP. Keep images relevant, optimized,
and owned by the same repository document area.
