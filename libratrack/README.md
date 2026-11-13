# LibraTrack

## 1. Project overview

LibraTrack is a library catalog and circulation system. Members can browse and request books, review loans and fines, manage their profiles, and receive in-app notifications. Library staff can manage books, members, loans, requests, returns, and fine payments from the admin area.

The application uses:

- Next.js 16 with the App Router for the frontend and API route handlers
- TypeScript
- Tailwind CSS
- MySQL Server 8.0
- `mysql2` for database access
- `bcryptjs` for password hashing
- `jose` for signed JWT sessions

LibraTrack has two roles:

- **ADMIN** — the librarian role, with access to management and circulation tools.
- **MEMBER** — the patron role, with access to the catalog, personal account, requests, and notifications.

## 2. Prerequisites

Install these tools before setting up the project:

- Node.js 18 or newer
- MySQL Server 8.0 and the MySQL root password you chose during installation
- Git
- Visual Studio Code (optional, but recommended)

Check the installed Node.js version.

### Windows PowerShell

```powershell
node -v
```

### macOS/Linux

```bash
node -v
```

The output must be version 18 or newer.

## 3. Clone and install

Never work directly on `main`. The `main` branch is protected, so create a personal feature branch before making changes. Replace placeholders such as `<repository-url>` and `<your-branch-name>` with real values.

### Windows PowerShell

```powershell
git clone <repository-url>
```

```powershell
cd <repository-folder>
```

```powershell
git checkout -b <your-branch-name>
```

```powershell
cd libratrack
```

```powershell
npm install
```

### macOS/Linux

```bash
git clone <repository-url>
```

```bash
cd <repository-folder>
```

```bash
git checkout -b <your-branch-name>
```

```bash
cd libratrack
```

```bash
npm install
```

The project’s `package.json` is inside the `libratrack` folder. Run all `npm` and database-loading commands below from that folder.

## 4. Create your `.env.local`

This is the setup step people most often miss. `.env.local` stores secrets for your local machine. It is not included in the repository and must never be committed, shared in chat, posted in an issue, or copied from another teammate. Every teammate creates their own file.

Copy the safe template.

### Windows PowerShell

```powershell
Copy-Item .env.example .env.local
```

### macOS/Linux

```bash
cp .env.example .env.local
```

Open the new file in Visual Studio Code.

### Windows PowerShell

```powershell
code .env.local
```

### macOS/Linux

```bash
code .env.local
```

Replace its contents with this exact layout. Do not add quotes or spaces around `=`.

```dotenv
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=<your own MySQL root password>
DB_NAME=libratrack
JWT_SECRET=<generated below>
```

What the variables mean:

- `DB_HOST` is the MySQL server address. `127.0.0.1` means MySQL is running on your computer.
- `DB_USER` is the MySQL account used by the app. Using `root` is acceptable for local development only; do not use it in production.
- `DB_PASSWORD` is your own local MySQL root password from the MySQL installation. It will usually differ for every teammate.
- `DB_NAME` is the application database created by `db/schema.sql`.
- `JWT_SECRET` signs login-session tokens. It must be private and unpredictable.

Generate a JWT secret with Node.js.

### Windows PowerShell

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### macOS/Linux

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output, paste it immediately after `JWT_SECRET=`, and save the file. Each teammate should generate their own secret. It should be at least 32 characters and can be different on every machine.

Verify that the environment file exists.

### Windows PowerShell

```powershell
Get-ChildItem -Force .env* | Select-Object Name,Length
```

### macOS/Linux

```bash
ls -la .env*
```

Restart the development server after every `.env.local` change. Next.js reads this file when the server starts, not continuously while it is running.

## 5. Load the database

Load the SQL files in this exact order from the `libratrack` folder:

1. `db/schema.sql` creates the database and tables.
2. `db/procedures.sql` creates the issue and return stored procedures.
3. `db/seed.sql` inserts sample users, books, authors, and loans.

MySQL prompts for the root password after each command. Type the same local MySQL root password used for `DB_PASSWORD`; the password is not displayed while typing. A successful command normally produces no output.

On Windows, the full executable path is often necessary because `mysql.exe` may not be on `PATH`. If MySQL was installed elsewhere, locate it first.

### Windows PowerShell

```powershell
Get-ChildItem "C:\Program Files\MySQL" -Recurse -Filter mysql.exe -ErrorAction SilentlyContinue | Select-Object FullName
```

Then load each file separately.

```powershell
Get-Content db\schema.sql -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

```powershell
Get-Content db\procedures.sql -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

```powershell
Get-Content db\seed.sql -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

### macOS/Linux

```bash
mysql -u root -p < db/schema.sql
```

```bash
mysql -u root -p < db/procedures.sql
```

```bash
mysql -u root -p < db/seed.sql
```

## 6. Verify the data

Run one count query to confirm that all seed data loaded. The expected result is 4 users, 15 books, 8 authors, and 2 loans.

### Windows PowerShell

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "USE libratrack; SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM books) AS books, (SELECT COUNT(*) FROM authors) AS authors, (SELECT COUNT(*) FROM loans) AS loans;"
```

### macOS/Linux

```bash
mysql -u root -p -e "USE libratrack; SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM books) AS books, (SELECT COUNT(*) FROM authors) AS authors, (SELECT COUNT(*) FROM loans) AS loans;"
```

Expected counts:

| users | books | authors | loans |
| ---: | ---: | ---: | ---: |
| 4 | 15 | 8 | 2 |

## 7. Run the app

Start the development server from the `libratrack` folder.

### Windows PowerShell

```powershell
npm run dev
```

### macOS/Linux

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The frontend and API run together in the same Next.js process. There is no separate backend server to start. If Next.js prints a warning about multiple lockfiles, it is harmless for local development; use the local URL shown by the terminal.

## 8. Test accounts

All seeded development accounts use the password `Password123!`.

| Role | Name | Email | What the role can do |
| --- | --- | --- | --- |
| ADMIN | Avery Morgan | `admin@libratrack.test` | Manage books, members, requests, loans, returns, and fines; view the admin dashboard and catalog. |
| MEMBER | Maya Patel | `maya.patel@libratrack.test` | Browse and request books; view loans, borrowing history, fines, notifications, and profile. Includes a seeded current loan. |
| MEMBER | Ethan Brooks | `ethan.brooks@libratrack.test` | Use member catalog and account features. Includes seeded returned-loan history. |
| MEMBER | Sofia Ramirez | `sofia.ramirez@libratrack.test` | Use member catalog and account features. |

These accounts and credentials are for local development only.

## 9. Reset the database to a clean state

Resetting deletes every user, loan, request, fine, and catalog change in your local `libratrack` database. Do not run these commands against a shared or production database.

First drop the database, then reload `schema.sql`, `procedures.sql`, and `seed.sql` in that order.

### Windows PowerShell

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "DROP DATABASE IF EXISTS libratrack;"
```

```powershell
Get-Content db\schema.sql -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

```powershell
Get-Content db\procedures.sql -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

```powershell
Get-Content db\seed.sql -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

### macOS/Linux

```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS libratrack;"
```

```bash
mysql -u root -p < db/schema.sql
```

```bash
mysql -u root -p < db/procedures.sql
```

```bash
mysql -u root -p < db/seed.sql
```

## 10. Git workflow for the team

Work on your own branch, make small focused commits, push your branch, and open a pull request into the protected `main` branch. Reference the relevant issue number in commits and pull requests when one exists.

The commands are the same on both platforms, but they are shown separately for clarity.

### Windows PowerShell

Create a branch from the appropriate starting branch:

```powershell
git checkout -b <your-branch-name>
```

Before staging, review your changes:

```powershell
git status
```

Confirm that `.env.local` and `node_modules` are **not** listed. Never stage or commit either one.

Stage the intended changes:

```powershell
git add .
```

Commit with a short, meaningful message and include an issue number when applicable:

```powershell
git commit -m "Add member request workflow (#123)"
```

Push the branch:

```powershell
git push -u origin <your-branch-name>
```

### macOS/Linux

Create a branch from the appropriate starting branch:

```bash
git checkout -b <your-branch-name>
```

Before staging, review your changes:

```bash
git status
```

Confirm that `.env.local` and `node_modules` are **not** listed. Never stage or commit either one.

Stage the intended changes:

```bash
git add .
```

Commit with a short, meaningful message and include an issue number when applicable:

```bash
git commit -m "Add member request workflow (#123)"
```

Push the branch:

```bash
git push -u origin <your-branch-name>
```

Then open a pull request from your branch into `main`. Do not push directly to `main`.

## 11. Troubleshooting

### Problem: `Missing required database environment variables`

**Fix:** Confirm `.env.local` exists in the same `libratrack` folder as `package.json`. Make sure it is named exactly `.env.local`, not `.env.local.txt`, and contains all required variables. Save it and restart `npm run dev`.

### Problem: `Access denied for user`

**Fix:** `DB_PASSWORD` is incorrect. Enter the root password chosen when MySQL was installed. Do not add quotes or spaces around the value, then restart the development server.

### Problem: `Unknown database 'libratrack'`

**Fix:** The schema was not loaded. Run the `db/schema.sql` command in section 5, followed by the procedures and seed commands.

### Problem: `mysql` is not recognized

**Fix:** On Windows, use the full path to `mysql.exe` shown in this guide or add the MySQL Server `bin` directory to `PATH`. Use the search command in section 5 if the installation path differs.

### Problem: `Could not read package.json`

**Fix:** The terminal is in the wrong folder. Change into the application folder before running npm commands.

```bash
cd libratrack
```

### Problem: Login says invalid credentials for seeded users

**Fix:** `db/seed.sql` was not loaded, or it was loaded before the schema existed. Load `schema.sql`, then `procedures.sql`, then `seed.sql`. If the database is partially initialized, follow the clean reset steps in section 9.

### Problem: Port 3000 is already in use

**Fix:** Stop the other process using port 3000, or use the alternate local URL printed by Next.js, such as `http://localhost:3001`.

### Problem: JWT errors or unexpected logouts

**Fix:** Confirm `JWT_SECRET` exists and is at least 32 characters. If it was changed, restart the development server and clear the site cookies for `localhost` before signing in again. Existing cookies cannot be verified with a new secret.

## 12. Project structure

```text
app/          Pages, layouts, loading/error states, and route-specific UI.
app/api/      Next.js route handlers for authentication and application APIs.
components/   Shared navigation, tables, forms, modals, notices, and UI helpers.
lib/          Authentication, authorization, database, and server-side helpers.
db/           MySQL schema, stored procedures, and seed data.
scripts/      Small development utility scripts.
proxy.ts      Request-time route guard and role-based redirects.
```
