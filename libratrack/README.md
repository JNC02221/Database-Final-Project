# LibraTrack

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting started

### 1. Prerequisites

Install the following before setting up LibraTrack:

- Node.js 18 or newer
- MySQL Server 8.0
- Git

### 2. Clone and install

Clone the repository, create your own working branch, enter the app directory, and install the dependencies. Replace the placeholders with the repository URL and your branch name.

```bash
git clone <repository-url>
```

```bash
cd <repository-directory>
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

Run the remaining commands in this guide from the `libratrack` folder unless stated otherwise.

### 3. Configure the environment

Copy the example environment file.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

On macOS or Linux:

```bash
cp .env.example .env.local
```

Open `.env.local` and provide values for all five variables:

```dotenv
DB_HOST=127.0.0.1
DB_USER=libratrack_app
DB_PASSWORD=your_database_password
DB_NAME=libratrack
JWT_SECRET=your_long_random_secret
```

`.env.local` contains secrets and must never be committed to Git.

### 4. Load the database

Load the SQL files in this order: `schema.sql`, `procedures.sql`, then `seed.sql`. MySQL asks for the root password each time. A successful command normally produces no output.

#### Windows PowerShell

PowerShell does not support the `<` input redirect used by the macOS/Linux commands below. Run each command separately:

```powershell
Get-Content db\schema.sql -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

```powershell
Get-Content db\procedures.sql -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

```powershell
Get-Content db\seed.sql -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

If `mysql` is not recognized, use the full executable path shown above, adjusting it if MySQL is installed elsewhere, or add the MySQL Server `bin` folder to your `PATH`.

#### macOS or Linux

Run each command separately:

```bash
mysql -u root -p < db/schema.sql
```

```bash
mysql -u root -p < db/procedures.sql
```

```bash
mysql -u root -p < db/seed.sql
```

### 5. Verify the seed data

On Windows PowerShell:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "USE libratrack; SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM books) AS books, (SELECT COUNT(*) FROM authors) AS authors, (SELECT COUNT(*) FROM loans) AS loans;"
```

On macOS or Linux:

```bash
mysql -u root -p -e "USE libratrack; SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM books) AS books, (SELECT COUNT(*) FROM authors) AS authors, (SELECT COUNT(*) FROM loans) AS loans;"
```

The expected counts are:

| users | books | authors | loans |
| ---: | ---: | ---: | ---: |
| 4 | 15 | 8 | 2 |

### 6. Reset the database

To start fresh, first drop the existing development database. The next run of `schema.sql` recreates the `libratrack` database and its tables; then `procedures.sql` recreates the stored procedures and `seed.sql` reloads the sample data.

On Windows PowerShell:

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

On macOS or Linux:

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

Dropping the database deletes all data currently stored in it. Only use these reset commands for a local development database.

### 7. Sample accounts

These accounts are for development only. They all use the shared password `Password123!`.

| Role | Email |
| --- | --- |
| Admin | `admin@libratrack.test` |
| Member | `maya.patel@libratrack.test` |
| Member | `ethan.brooks@libratrack.test` |
| Member | `sofia.ramirez@libratrack.test` |

Never use these credentials in production.

### 8. Run the app

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You can start editing the page by modifying `app/page.tsx`; the page updates as you edit the file.

### 9. Troubleshooting

#### `mysql` is not recognized

Use the full path to `mysql.exe` shown in the Windows commands, adjusting it for your installation, or add the MySQL Server `bin` folder to `PATH`.

#### `Access denied for user`

The MySQL username or password is incorrect. Re-enter the correct root password or confirm the credentials for the MySQL user you are using.

#### `Unknown database 'libratrack'`

The schema has not been loaded yet. Run the `schema.sql` command before loading the procedures or seed data.

## Learn more

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out the [Next.js GitHub repository](https://github.com/vercel/next.js) for examples and contribution information.

## Deploy on Vercel

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=nextjs&utm_source=create-next-app&utm_campaign=create-next-app-readme).

See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
