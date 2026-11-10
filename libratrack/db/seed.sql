USE libratrack;

-- All sample accounts use the password: Password123!
INSERT INTO users
  (user_id, full_name, email, password_hash, role, phone, address, status)
VALUES
  (1, 'Avery Morgan', 'admin@libratrack.test', '$2b$12$QuMqzjnBSCR20JAj20PHLOdI9t.dI0TJRRj4QD1unnfq562sbFm96', 'ADMIN', '312-555-0100', '100 Library Way, Chicago, IL 60601', 'ACTIVE'),
  (2, 'Maya Patel', 'maya.patel@libratrack.test', '$2b$12$6R/e2SvoIj50BnQ97Z.QFeiIc.rFU8tM3NcuL0rvTfm2Y.oHJN/c2', 'MEMBER', '312-555-0101', '2148 W Grace St, Chicago, IL 60618', 'ACTIVE'),
  (3, 'Ethan Brooks', 'ethan.brooks@libratrack.test', '$2b$12$QuWnCnr9OjHMOnlnTEtzyuVY7B2Uv0VvU2K6FtXWyNP9rNMLvGLQO', 'MEMBER', '312-555-0102', '735 S Dearborn St, Chicago, IL 60605', 'ACTIVE'),
  (4, 'Sofia Ramirez', 'sofia.ramirez@libratrack.test', '$2b$12$V9T70G5M/26/Xc3V7FGDPei5HrZYEPJzTDuE1xvGo1j4isfJuOoiS', 'MEMBER', '312-555-0103', '4920 N Marine Dr, Chicago, IL 60640', 'ACTIVE');

INSERT INTO publishers (publisher_id, name, country, website)
VALUES
  (1, 'Penguin Random House', 'United States', 'https://www.penguinrandomhouse.com'),
  (2, 'HarperCollins', 'United States', 'https://www.harpercollins.com'),
  (3, 'Simon & Schuster', 'United States', 'https://www.simonandschuster.com'),
  (4, 'Macmillan Publishers', 'United Kingdom', 'https://us.macmillan.com'),
  (5, 'O''Reilly Media', 'United States', 'https://www.oreilly.com');

INSERT INTO categories (category_id, name, description)
VALUES
  (1, 'Fiction', 'Novels and short stories spanning literary and popular fiction.'),
  (2, 'Science Fiction', 'Speculative fiction grounded in science, technology, and imagined futures.'),
  (3, 'Mystery', 'Crime, detective, suspense, and mystery stories.'),
  (4, 'History', 'Works covering historical people, periods, and events.'),
  (5, 'Technology', 'Programming, databases, software engineering, and computing.');

INSERT INTO authors (author_id, full_name, biography)
VALUES
  (1, 'George Orwell', 'English novelist and essayist known for incisive social criticism.'),
  (2, 'Octavia E. Butler', 'American science-fiction author whose work explores power, identity, and humanity.'),
  (3, 'Agatha Christie', 'English writer celebrated for enduring detective novels and mysteries.'),
  (4, 'Yuval Noah Harari', 'Historian and author whose work examines humanity across broad timescales.'),
  (5, 'Martin Kleppmann', 'Software engineer, researcher, and author focused on distributed data systems.'),
  (6, 'Robert C. Martin', 'Software engineer and author known for writing about software craftsmanship.'),
  (7, 'Neil Gaiman', 'English author of novels, comics, short fiction, and mythology-inspired works.'),
  (8, 'Ursula K. Le Guin', 'American author renowned for speculative fiction and imaginative world-building.');

INSERT INTO books
  (book_id, isbn, title, publisher_id, category_id, edition, publication_year, language, shelf_location, total_copies, available_copies, added_on)
VALUES
  (1, '9780451524935', '1984', 1, 1, 'Signet Classics', 1950, 'English', 'FIC-ORW-01', 4, 3, '2025-01-10'),
  (2, '9780451526342', 'Animal Farm', 1, 1, 'Anniversary Edition', 1996, 'English', 'FIC-ORW-02', 3, 3, '2025-01-10'),
  (3, '9780446675505', 'Parable of the Sower', 2, 2, 'Reprint Edition', 2000, 'English', 'SF-BUT-01', 3, 3, '2025-01-15'),
  (4, '9781538732182', 'Kindred', 2, 2, 'Reissue Edition', 2022, 'English', 'SF-BUT-02', 2, 2, '2025-01-15'),
  (5, '9780062073488', 'And Then There Were None', 2, 3, 'Reprint Edition', 2011, 'English', 'MYS-CHR-01', 3, 3, '2025-01-18'),
  (6, '9780062693662', 'Murder on the Orient Express', 2, 3, 'Movie Tie-In Edition', 2017, 'English', 'MYS-CHR-02', 2, 2, '2025-01-18'),
  (7, '9780062316097', 'Sapiens: A Brief History of Humankind', 2, 4, 'First U.S. Edition', 2015, 'English', 'HIS-HAR-01', 4, 4, '2025-01-22'),
  (8, '9780062464316', 'Homo Deus: A Brief History of Tomorrow', 2, 4, 'First U.S. Edition', 2017, 'English', 'HIS-HAR-02', 2, 2, '2025-01-22'),
  (9, '9781449373320', 'Designing Data-Intensive Applications', 5, 5, 'First Edition', 2017, 'English', 'TEC-KLE-01', 5, 5, '2025-02-01'),
  (10, '9780132350884', 'Clean Code', 1, 5, 'First Edition', 2008, 'English', 'TEC-MAR-01', 4, 4, '2025-02-01'),
  (11, '9780134494166', 'Clean Architecture', 1, 5, 'First Edition', 2017, 'English', 'TEC-MAR-02', 3, 3, '2025-02-01'),
  (12, '9780062572233', 'American Gods', 2, 1, 'Tenth Anniversary Edition', 2016, 'English', 'FIC-GAI-01', 3, 3, '2025-02-08'),
  (13, '9780060558123', 'The Ocean at the End of the Lane', 2, 1, 'Reprint Edition', 2014, 'English', 'FIC-GAI-02', 2, 2, '2025-02-08'),
  (14, '9780441478125', 'The Left Hand of Darkness', 1, 2, 'Ace Science Fiction Edition', 2000, 'English', 'SF-LEG-01', 3, 3, '2025-02-12'),
  (15, '9780547773742', 'A Wizard of Earthsea', 4, 2, 'Reissue Edition', 2012, 'English', 'SF-LEG-02', 3, 3, '2025-02-12');

INSERT INTO book_authors (book_id, author_id)
VALUES
  (1, 1),
  (2, 1),
  (3, 2),
  (4, 2),
  (5, 3),
  (6, 3),
  (7, 4),
  (8, 4),
  (9, 5),
  (10, 6),
  (11, 6),
  (12, 7),
  (13, 7),
  (14, 8),
  (15, 8);

INSERT INTO loans
  (loan_id, user_id, book_id, issued_by, issue_date, due_date, return_date, status)
VALUES
  (1, 2, 1, 1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY), NULL, 'ISSUED'),
  (2, 3, 5, 1, DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 6 DAY), DATE_SUB(CURDATE(), INTERVAL 8 DAY), 'RETURNED');
