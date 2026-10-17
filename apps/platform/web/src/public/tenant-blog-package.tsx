import { PublicArticlePage, PublicBlogPage } from "@codexsun/blog/web";
import { useParams } from "@tanstack/react-router";
import { TenantSiteTemplate } from "./tenant-site/templates/tenant-site.template";
import { useTenantSite } from "./tenant-site/tenant-site.context";

function TenantBlogContent({ slug }: { slug?: string }) {
  const { portal, loading } = useTenantSite();
  const tenantKey = portal.tenantCode?.trim().toLowerCase() || "codexsun";
  const mediaBasePath = portal.blogMediaPath || `/storage/${tenantKey}/public/blogs/images`;
  if (loading) return <p role="status">Loading stories�</p>;
  if (portal.blogEnabled === false) return <p>Stories are not available for this site.</p>;
  if (slug) return <PublicArticlePage slug={slug} mediaBasePath={mediaBasePath} />;
  return <PublicBlogPage mediaBasePath={mediaBasePath} />;
}

export function TenantBlogPackagePage() {
  return (
    <TenantSiteTemplate activePage="blog" pageTitle="Blog">
      <TenantBlogContent />
    </TenantSiteTemplate>
  );
}

export function TenantBlogArticlePackagePage() {
  const { slug } = useParams({ strict: false });
  return (
    <TenantSiteTemplate activePage="blog" pageTitle="Blog">
      <TenantBlogContent slug={String(slug ?? "")} />
    </TenantSiteTemplate>
  );
}
