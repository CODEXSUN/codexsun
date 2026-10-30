export function isSqliteDatabase(db: {
  getExecutor: () => { adapter: { constructor: { name: string } } };
}): boolean {
  try {
    const adapterName = db.getExecutor().adapter.constructor.name.toLowerCase();
    return adapterName.includes("sqlite");
  } catch {
    return false;
  }
}
