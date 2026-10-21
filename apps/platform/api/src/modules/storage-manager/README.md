# Storage Manager

The Storage Manager owns application and tenant file storage.

## Company branding

- `POST /tenant/media/company-logo` uploads a light logo, dark logo, or favicon for a saved company.
- The request must include `companyId`, `contentBase64`, and `variant`.
- The tenant session must have `core.application.records.update` access.
- New files use `companies/{companyId}/logo/` in the tenant public storage root.
- Reads use the old tenant logo folder only when a company-scoped file does not exist.
- `GET /tenant/media/companies/:companyId/company-logo/:variant` requires tenant view access.
- `GET /public/app-portal/company-logo/:variant` serves the Application Company branding asset for the request domain.
- The public route uses the default tenant only for the configured shared application domain.

The module accepts SVG, PNG, JPEG, WebP, AVIF, GIF, ICO, and BMP files. It checks the
file signature before storage. SVG files cannot contain scripts or external content.
SVG files can be up to 640 KB. Raster image files can be up to 5 MB.
