# Safe Database Migrations in Production

When deploying to production environments like AWS, Vercel, or other remote servers, **NEVER** use `npx prisma db push`. This command is designed for rapid local prototyping and will aggressively drop tables to match the schema, resulting in complete data loss (including users, licenses, and configurations) if it encounters a structural change it cannot automatically resolve.

## The Production Workflow

To safely upgrade a production database, you must use Prisma Migrations.

### 1. Generate the Migration Locally
When you make a change to `prisma/schema.prisma` on your local machine:
```bash
npx prisma migrate dev --name <describe_your_change>
```
*Note: This command requires a "shadow database" to calculate diffs. If your local DB user lacks permissions to create databases, you can point a `SHADOW_DATABASE_URL` in your `.env` to a secondary empty DB, or generate the migration against a local Docker SQLite/MySQL container before pushing code.*

This command creates a folder in `prisma/migrations/` containing the exact `.sql` script representing your changes.

### 2. Commit to Version Control
Commit the new `prisma/migrations` folder to GitHub. This is the source of truth for your database's evolution.

### 3. Deploy to Production
During your CD/CI pipeline (e.g., GitHub Actions, AWS CodeBuild) or when SSH'd into the production server, run the deploy command:
```bash
npx prisma migrate deploy
```
**Why this is safe:**
- `migrate deploy` **only** runs SQL files from the `prisma/migrations` folder that have not yet been executed against the target DB.
- It will **abort and throw an error** if a migration contains a destructive action (like dropping a populated column) rather than silently erasing data.
- It maintains a `_prisma_migrations` table in your production DB to strictly track history.

### What if a change *must* drop data?
If you are changing a column type (like `VarBinary(512)` to `LongBlob`) and Prisma flags it as destructive:
1. Prisma will ask for confirmation during `npx prisma migrate dev`.
2. The generated `.sql` file will contain a `DROP COLUMN` and `ADD COLUMN`.
3. **Before committing**, manually edit that generated `migration.sql` file. Write standard SQL to create the new column, copy the data from the old column, and then drop the old column.
4. Then commit and run `migrate deploy`.

## Quick Reference
- **Local Dev:** `npx prisma db push` (Only if you don't care about the local data).
- **Staging/Prod Setup:** `npx prisma migrate dev` (Creates the SQL history).
- **Staging/Prod Deploy:** `npx prisma migrate deploy` (Safely runs the history).
