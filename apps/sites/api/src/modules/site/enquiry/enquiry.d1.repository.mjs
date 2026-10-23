import { randomBytes } from "node:crypto";

export class D1EnquiryRepository {
  constructor(database, siteUuid, siteKey) {
    this.database = database;
    this.siteUuid = siteUuid;
    this.siteKey = siteKey;
  }
  async marketingPending(now) {
    await this.verifyIdentity();
    const result = await this.database
      .prepare(
        "SELECT e.reference,e.name,e.email,e.phone,e.message,e.consented_at FROM sites_marketing_outbox o JOIN sites_enquiries e ON e.reference=o.reference WHERE o.status='pending' AND o.attempts<8 AND o.available_at<=? AND e.deleted_at IS NULL ORDER BY e.created_at LIMIT 20"
      )
      .bind(now)
      .all();
    return result.results;
  }
  async marketingDelivered(reference, receipt) {
    await this.database
      .prepare("UPDATE sites_marketing_outbox SET status='delivered',receipt=? WHERE reference=?")
      .bind(receipt, reference)
      .run();
  }
  async marketingFailed(reference, now) {
    await this.database
      .prepare(
        "UPDATE sites_marketing_outbox SET attempts=attempts+1,available_at=? WHERE reference=? AND status='pending'"
      )
      .bind(now + 60000, reference)
      .run();
  }
  async verifyIdentity() {
    const row = await this.database
      .prepare("SELECT site_uuid,site_key FROM sites_delivery_identity WHERE id=1")
      .first();
    if (row?.site_uuid !== this.siteUuid || row?.site_key !== this.siteKey)
      throw new Error("Enquiry database identity mismatch.");
  }
  async secret() {
    await this.database
      .prepare("INSERT OR IGNORE INTO sites_enquiry_settings VALUES('rate-secret',?)")
      .bind(randomBytes(32).toString("hex"))
      .run();
    const row = await this.database
      .prepare("SELECT value FROM sites_enquiry_settings WHERE key='rate-secret'")
      .first();
    return row.value;
  }
  find(key) {
    return this.database
      .prepare("SELECT reference,payload_hash FROM sites_enquiries WHERE request_key=?")
      .bind(key)
      .first();
  }
  async receive(input, key, hash, rateKey, reference, now) {
    const at = new Date(now).toISOString();
    try {
      await this.database
        .prepare(
          `INSERT INTO sites_enquiries
        (reference,request_key,payload_hash,rate_key,name,email,company,phone,message,consented_at,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING`
        )
        .bind(
          reference,
          key,
          hash,
          rateKey,
          input.name,
          input.email,
          input.company,
          input.phone,
          input.message,
          at,
          now,
          at
        )
        .run();
    } catch (error) {
      if (String(error.message).includes("sites_enquiry_rate_limit"))
        throw Object.assign(new Error("Too many enquiries. Please try again later."), {
          status: 429
        });
      throw error;
    }
    const saved = await this.find(key);
    if (saved?.payload_hash !== hash)
      throw Object.assign(new Error("This request key was used for a different enquiry."), {
        status: 409
      });
    return { reference: saved.reference, received: true };
  }
  async expire(now = Date.now()) {
    const cutoff = now - 90 * 86400000;
    await this.database.batch([
      this.database
        .prepare(
          "DELETE FROM sites_enquiry_activity WHERE reference IN (SELECT reference FROM sites_enquiries WHERE created_at < ?)"
        )
        .bind(cutoff),
      this.database.prepare("DELETE FROM sites_enquiries WHERE created_at < ?").bind(cutoff),
      this.database.prepare("DELETE FROM sites_enquiry_limits WHERE expires_at < ?").bind(now)
    ]);
  }
}
