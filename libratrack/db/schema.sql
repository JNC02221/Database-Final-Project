CREATE DATABASE IF NOT EXISTS libratrack
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE libratrack;

CREATE TABLE users (
  user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
  phone VARCHAR(30) NULL,
  address VARCHAR(255) NULL,
  status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE authors (
  author_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(150) NOT NULL,
  biography TEXT NULL,
  PRIMARY KEY (author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE publishers (
  publisher_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  country VARCHAR(100) NULL,
  website VARCHAR(255) NULL,
  PRIMARY KEY (publisher_id),
  UNIQUE KEY uq_publishers_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE categories (
  category_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  PRIMARY KEY (category_id),
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE books (
  book_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  isbn VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  publisher_id INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  edition VARCHAR(50) NULL,
  publication_year SMALLINT UNSIGNED NULL,
  language VARCHAR(50) NOT NULL DEFAULT 'English',
  shelf_location VARCHAR(50) NOT NULL,
  total_copies INT UNSIGNED NOT NULL DEFAULT 1,
  available_copies INT UNSIGNED NOT NULL DEFAULT 1,
  added_on DATE NOT NULL DEFAULT (CURRENT_DATE),
  PRIMARY KEY (book_id),
  UNIQUE KEY uq_books_isbn (isbn),
  KEY idx_books_title (title),
  KEY idx_books_isbn (isbn),
  CONSTRAINT chk_books_copy_counts
    CHECK (0 <= available_copies AND available_copies <= total_copies),
  CONSTRAINT fk_books_publisher
    FOREIGN KEY (publisher_id) REFERENCES publishers (publisher_id) ON DELETE RESTRICT,
  CONSTRAINT fk_books_category
    FOREIGN KEY (category_id) REFERENCES categories (category_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE book_authors (
  book_id INT UNSIGNED NOT NULL,
  author_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (book_id, author_id),
  KEY idx_book_authors_author (author_id),
  CONSTRAINT fk_book_authors_book
    FOREIGN KEY (book_id) REFERENCES books (book_id) ON DELETE RESTRICT,
  CONSTRAINT fk_book_authors_author
    FOREIGN KEY (author_id) REFERENCES authors (author_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE loans (
  loan_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  book_id INT UNSIGNED NOT NULL,
  issued_by INT UNSIGNED NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE NULL,
  status ENUM('ISSUED', 'RETURNED', 'OVERDUE') NOT NULL DEFAULT 'ISSUED',
  PRIMARY KEY (loan_id),
  KEY idx_loans_user_status (user_id, status),
  KEY idx_loans_due_date (due_date),
  KEY idx_loans_book (book_id),
  KEY idx_loans_issued_by (issued_by),
  CONSTRAINT fk_loans_user
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_loans_book
    FOREIGN KEY (book_id) REFERENCES books (book_id) ON DELETE RESTRICT,
  CONSTRAINT fk_loans_issued_by
    FOREIGN KEY (issued_by) REFERENCES users (user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE fines (
  fine_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  loan_id INT UNSIGNED NOT NULL,
  amount DECIMAL(8,2) NOT NULL,
  days_overdue INT UNSIGNED NOT NULL,
  paid_status ENUM('UNPAID', 'PAID') NOT NULL DEFAULT 'UNPAID',
  paid_date DATE NULL,
  PRIMARY KEY (fine_id),
  KEY idx_fines_loan (loan_id),
  CONSTRAINT fk_fines_loan
    FOREIGN KEY (loan_id) REFERENCES loans (loan_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE reservations (
  reservation_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  book_id INT UNSIGNED NOT NULL,
  reserved_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_on DATETIME NULL,
  status ENUM('PENDING', 'READY', 'FULFILLED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (reservation_id),
  KEY idx_reservations_user (user_id),
  KEY idx_reservations_book (book_id),
  CONSTRAINT fk_reservations_user
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_reservations_book
    FOREIGN KEY (book_id) REFERENCES books (book_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
