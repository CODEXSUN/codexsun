# Zetro API

The API will own Zetro modules, SQLite repositories, public contracts, worker
dispatch boundaries, and audit records. It must expose versioned contracts and
validate all external input with Zod.

The API must not execute an unreviewed task. It creates worker attempts only
after the required review, guidance, and scope gates pass.
