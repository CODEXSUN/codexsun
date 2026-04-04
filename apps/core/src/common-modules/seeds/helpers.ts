import {
  commonModuleItemSchema,
  type CommonModuleItem,
  type CommonModuleKey,
} from "../../../shared/index.js"

export const timestamp = "2026-04-04T09:00:00.000Z"
export const defaultRecordId = "1"

export function defineItem(
  id: string,
  extra: Record<string, string | number | boolean | null>
): CommonModuleItem {
  return commonModuleItemSchema.parse({
    id,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...extra,
  })
}

export function defineCountry(
  slug: string,
  code: string,
  name: string,
  phoneCode: string | null
) {
  return defineItem(`country:${slug}`, {
    code,
    name,
    phone_code: phoneCode,
  })
}

export function defineState(
  slug: string,
  countryId: string,
  code: string,
  name: string
) {
  return defineItem(`state:${slug}`, {
    country_id: countryId,
    code,
    name,
  })
}

export function defineDistrict(slug: string, stateId: string, code: string, name: string) {
  return defineItem(`district:${slug}`, {
    state_id: stateId,
    code,
    name,
  })
}

export function defineCity(
  slug: string,
  stateId: string,
  districtId: string,
  code: string,
  name: string
) {
  return defineItem(`city:${slug}`, {
    state_id: stateId,
    district_id: districtId,
    code,
    name,
  })
}

export function definePincode(input: {
  code: string
  areaName: string
  countryId: string
  stateId: string
  districtId: string
  cityId: string
}) {
  return defineItem(`pincode:${input.code}`, {
    code: input.code,
    area_name: input.areaName,
    country_id: input.countryId,
    state_id: input.stateId,
    district_id: input.districtId,
    city_id: input.cityId,
  })
}

export function defineNamedModuleItem(
  prefix: string,
  slug: string,
  code: string,
  name: string,
  description: string | null = null
) {
  return defineItem(`${prefix}:${slug}`, {
    code,
    name,
    description,
  })
}

export type SeedMap = Partial<Record<CommonModuleKey, CommonModuleItem[]>>
