# Photo / image policy

- Images used for AI analysis (food, injury, progress) do **not** need long-term database storage.
- Recommended flow: upload → analyze → save **structured facts only** (JSON) → **delete file**.
- Only keep photos if the user explicitly wants a progress gallery.
