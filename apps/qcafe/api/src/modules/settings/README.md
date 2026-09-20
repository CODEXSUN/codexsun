# Q Cafe Settings Module

This module owns safe runtime policy and connector metadata. It exposes database readiness without credentials, persists the local-to-cloud sync switch, and stores connector names, kinds, endpoint labels, and secret references.

The active database driver and all credential values remain deployment configuration. The browser cannot rewrite `.env`, retrieve a database URL, or store connector secret values.
