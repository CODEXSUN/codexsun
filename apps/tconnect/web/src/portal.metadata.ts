import type {Company} from "./modules/company/company.types";
import type {Association} from "./modules/association/association.types";
import type {CommunityPost} from "./modules/community/community.types";
export function portalMetadata(pathname:string,records:{company?:Company|undefined;association?:Association|undefined;post?:CommunityPost|undefined}={}){
 const path=pathname.split("/").filter(Boolean);const names:Record<string,string>={companies:"Find Textile Businesses & Products",categories:"Textile Categories",associations:"Associations & Industry Networks",community:"Textile Insights & Community",register:path[1]==="buyer"?"Buyer Registration":"Seller & Member Registration",join:"Join the Textile Business Network",login:"Member & Buyer Login",contact:"Contact Tirupur Connect",privacy:"Privacy Policy",terms:"Terms & Conditions",standards:"Textile Certifications & Standards",enterprises:"Textile Company Spotlights"};
 const record=path[0]==="companies"?records.company:path[0]==="associations"?records.association:undefined;const post=path[0]==="community"?records.post:undefined;
 const title=`${record?.name??post?.title??names[path[0]??""]??"Good Textile Business Starts with a Great Connection"} | Tirupur Connect`;
 const description=(record?.description??post?.body??"Find textile manufacturers, knitted fabrics, yarn, garments and specialist services. Connect with Tirupur’s business community, post requirements and compare seller quotations.").slice(0,180);
 const image=records.company?.logoDataUrl?`/social/companies/${records.company.slug}.${records.company.logoDataUrl.startsWith("data:image/jpeg")?"jpg":records.company.logoDataUrl.startsWith("data:image/png")?"png":"webp"}`:"/textiles/textile-hero.webp";
 return {title,description,canonical:`https://tirupurconnect.com${pathname.replace(/\/$/,"")||"/"}`,image:`https://tirupurconnect.com${image}`,type:post?"article":"website",sample:!!(record?.description??post?.body??"").match(/fictional|sample|demo/i)};
}
