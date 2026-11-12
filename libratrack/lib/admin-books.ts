import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export type BookInput = {
  isbn: string;
  title: string;
  authors: string[];
  category: string;
  publisher: string;
  edition: string | null;
  publication_year: number | null;
  language: string;
  shelf_location: string;
  total_copies: number;
};

type IdRow = RowDataPacket & { id: number };

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function parseBookInput(value: unknown): { data?: BookInput; error?: string } {
  if (!value || typeof value !== "object") return { error: "Invalid request body" };
  const body = value as Record<string, unknown>;
  const isbn = text(body.isbn, 20).replace(/[ -]/g, "");
  const title = text(body.title, 255);
  const category = text(body.category, 100);
  const publisher = text(body.publisher, 150);
  const language = text(body.language, 50) || "English";
  const shelfLocation = text(body.shelf_location, 50);
  const edition = text(body.edition, 50) || null;
  const yearValue = body.publication_year === "" || body.publication_year == null ? null : Number(body.publication_year);
  const totalCopies = Number(body.total_copies);
  const authors = Array.isArray(body.authors)
    ? [...new Set(body.authors.map((author) => text(author, 150)).filter(Boolean))]
    : [];

  if (!/^\d{9}[\dXx]$|^\d{13}$/.test(isbn)) return { error: "ISBN must be a valid ISBN-10 or ISBN-13" };
  if (!title || !category || !publisher || !shelfLocation || authors.length === 0) {
    return { error: "Title, at least one author, category, publisher, and shelf location are required" };
  }
  if (!Number.isInteger(totalCopies) || totalCopies < 1) return { error: "Total copies must be at least 1" };
  if (yearValue !== null && (!Number.isInteger(yearValue) || yearValue < 1000 || yearValue > new Date().getFullYear() + 1)) {
    return { error: `Publication year must be between 1000 and ${new Date().getFullYear() + 1}` };
  }
  return { data: { isbn, title, authors, category, publisher, edition, publication_year: yearValue, language, shelf_location: shelfLocation, total_copies: totalCopies } };
}

export async function findOrCreateNamed(
  connection: PoolConnection,
  table: "categories" | "publishers",
  idColumn: "category_id" | "publisher_id",
  name: string,
) {
  const [rows] = await connection.execute<IdRow[]>(`SELECT ${idColumn} AS id FROM ${table} WHERE name = ? LIMIT ?`, [name, 1]);
  if (rows[0]) return rows[0].id;
  try {
    const [result] = await connection.execute<ResultSetHeader>(`INSERT INTO ${table} (name) VALUES (?)`, [name]);
    return result.insertId;
  } catch (error) {
    if ((error as { code?: string }).code !== "ER_DUP_ENTRY") throw error;
    const [retry] = await connection.execute<IdRow[]>(`SELECT ${idColumn} AS id FROM ${table} WHERE name = ? LIMIT ?`, [name, 1]);
    return retry[0].id;
  }
}

export async function replaceBookAuthors(connection: PoolConnection, bookId: number, authors: string[]) {
  await connection.execute<ResultSetHeader>("DELETE FROM book_authors WHERE book_id = ?", [bookId]);
  for (const name of authors) {
    const [existing] = await connection.execute<IdRow[]>("SELECT author_id AS id FROM authors WHERE full_name = ? LIMIT ?", [name, 1]);
    let authorId = existing[0]?.id;
    if (!authorId) {
      const [created] = await connection.execute<ResultSetHeader>("INSERT INTO authors (full_name) VALUES (?)", [name]);
      authorId = created.insertId;
    }
    await connection.execute<ResultSetHeader>("INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)", [bookId, authorId]);
  }
}
