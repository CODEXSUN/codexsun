# Projex Add-ons Module

The add-ons module exposes the repository add-on registry as an authenticated Projex catalog.

## Ownership

This module owns the `projex.addons` provider and `GET /api/v1/projex/addons`. It reads registry metadata and deployment enablement; it does not import or execute add-on packages.
