# Docs Catalog Module

Docs Catalog owns repository document discovery, its local index, and the Docs
health route. It exposes the `docs.catalog` provider contract to the Docs API.

The module depends on Platform Core only through its public provider contract.
It does not own documentation presentation or browser workspace composition.
