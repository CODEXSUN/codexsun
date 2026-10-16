import assert from "node:assert/strict";
import test from "node:test";
import {
  contactCreateSchema,
  contactSchema,
  prepareContactPayloadForSave,
  preserveOptionalTextInput
} from "./contact.schema";
import type { ContactSavePayload } from "./contact.types";

test("contact inputs preserve spaces until save", () => {
  assert.equal(preserveOptionalTextInput("AARAN SOFTWARE "), "AARAN SOFTWARE ");
  assert.equal(preserveOptionalTextInput(" "), " ");
  assert.equal(preserveOptionalTextInput(""), null);
});

test("contact payload trims text only when prepared for save", () => {
  const prepared = prepareContactPayloadForSave(contactPayload());

  assert.equal(prepared.code, "CUSTOMER-SOUTH-1");
  assert.equal(prepared.name, "Aaran Software Sundar");
  assert.equal(prepared.legalName, "AARAN SOFTWARE SUNDAR");
  assert.equal(prepared.gstin, "33ABCDE1234F1Z5");
  assert.equal(prepared.addresses[0]?.addressLine1, "42 Main Road");
  assert.equal(prepared.bankAccounts[0]?.holderName, "Aaran Software Sundar");
  assert.equal(prepared.bankAccounts[0]?.branch, "Tiruppur Main Road");
  assert.equal(prepared.description, "Preferred billing contact");
  assert.equal(contactSchema.safeParse(prepared).success, true);
});

test("new contacts may leave code blank for server numbering", () => {
  const blankCode = prepareContactPayloadForSave({ ...contactPayload(), code: "   " });
  assert.equal(blankCode.code, "");
  assert.equal(contactCreateSchema.safeParse(blankCode).success, true);
  assert.equal(contactSchema.safeParse(blankCode).success, false);

  const manualCode = prepareContactPayloadForSave(contactPayload());
  assert.equal(contactCreateSchema.safeParse(manualCode).success, true);
  assert.equal(manualCode.code, "CUSTOMER-SOUTH-1");

  const invalidCode = prepareContactPayloadForSave({ ...contactPayload(), code: "!!!" });
  assert.equal(contactCreateSchema.safeParse(invalidCode).success, false);
});

function contactPayload(): ContactSavePayload {
  return {
    code: " customer south 1 ",
    name: " Aaran Software Sundar ",
    legalName: " AARAN SOFTWARE SUNDAR ",
    typeId: 1,
    groupId: null,
    gstin: " 33ABCDE1234F1Z5 ",
    pan: null,
    msmeNo: null,
    msmeCategory: null,
    tanNo: null,
    tdsAvailable: false,
    tcsAvailable: false,
    openingBalance: 0,
    creditLimit: 0,
    website: " https://codexsun.com ",
    description: " Preferred billing contact ",
    status: "active",
    isActive: true,
    emails: [
      {
        id: 0,
        email: " billing@codexsun.com ",
        emailType: " Work ",
        isPrimary: true,
        sortOrder: 4
      }
    ],
    phones: [
      { id: 0, phone: " +91 98765 43210 ", phoneType: " Mobile ", isPrimary: true, sortOrder: 4 }
    ],
    addresses: [
      {
        id: 0,
        addressTypeId: 1,
        addressTypeName: " Billing ",
        addressLine1: " 42 Main Road ",
        addressLine2: " Near Central Park ",
        countryId: 1,
        countryName: " India ",
        stateId: 1,
        stateName: " Tamil Nadu ",
        districtId: 1,
        districtName: " Tiruppur ",
        cityId: 1,
        cityName: " Tiruppur ",
        pincodeId: 1,
        pincodeName: " 641601 ",
        isDefault: true,
        sortOrder: 4
      }
    ],
    bankAccounts: [
      {
        id: 0,
        bankNameId: 1,
        bankName: " HDFC Bank Limited ",
        accountType: " Current ",
        accountNumber: " 50200116001870 ",
        holderName: " Aaran Software Sundar ",
        ifsc: " HDFC0005519 ",
        branch: " Tiruppur Main Road ",
        isPrimary: true,
        sortOrder: 4
      }
    ],
    socialLinks: [
      {
        id: 0,
        platform: " Website ",
        url: " https://codexsun.com ",
        status: "active",
        isActive: true,
        sortOrder: 4
      }
    ]
  };
}
