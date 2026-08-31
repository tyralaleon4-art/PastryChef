---
name: iOS generated-file delivery
description: Reliable delivery of PDFs and other asynchronously generated files in iOS Safari.
---

Generate the file first, then expose a separate, explicit save/share action. Call the Web Share API synchronously from that second user click. Do not rely on a pre-opened blank tab or later blob-URL navigation, and never report that a tab opened without confirmation.

**Why:** iOS Safari can discard transient user activation while an asynchronous PDF render runs. A pre-created popup may remain inaccessible or never display the blob even though application code reports success.

**How to apply:** For any client-generated file that requires asynchronous work, show a truthful “ready” state after generation and let the next direct click invoke native sharing. Treat dismissal as cancellation, not success.