---
name: Shared ingredient deduplication
description: Product rules for merging migration-created ingredient copies without losing recipes.
---

Merge duplicate catalog entries by reassigning recipe and inventory references before removing the duplicate, within one transaction. Preserve recipe-row IDs, quantities and units. Same names alone do not justify automatic merging; differing prices, nutrition and stock require explicit selection of the record to keep.

**Why:** after restoring the shared catalog, the user reported duplicate ingredients on Render and required removal without losing recipes. Summing migration-cloned stock can double inventory.

**How to apply:** keep the administrator-selected record's metadata and stock without adding the duplicate's stock. Explain discarded differences before confirmation. Never treat the development database as evidence of Render's current data.
