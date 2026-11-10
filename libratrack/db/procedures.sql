USE libratrack;

DROP PROCEDURE IF EXISTS sp_issue_book;
DROP PROCEDURE IF EXISTS sp_return_book;

DELIMITER $$

CREATE PROCEDURE sp_issue_book(
  IN p_user_id INT UNSIGNED,
  IN p_book_id INT UNSIGNED,
  IN p_admin_id INT UNSIGNED
)
BEGIN
  DECLARE v_available_copies INT;
  DECLARE v_member_status VARCHAR(20);
  DECLARE v_active_loans INT DEFAULT 0;
  DECLARE v_unpaid_fines INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT available_copies
    INTO v_available_copies
    FROM books
    WHERE book_id = p_book_id
    FOR UPDATE;

  IF v_available_copies IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book not found.';
  END IF;

  IF v_available_copies = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book has no available copies.';
  END IF;

  SELECT status
    INTO v_member_status
    FROM users
    WHERE user_id = p_user_id AND role = 'MEMBER'
    FOR UPDATE;

  IF v_member_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Member not found.';
  END IF;

  IF v_member_status <> 'ACTIVE' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Member account is not active.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM users WHERE user_id = p_admin_id AND role = 'ADMIN' AND status = 'ACTIVE'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Issuing administrator is invalid or inactive.';
  END IF;

  SELECT COUNT(*)
    INTO v_active_loans
    FROM loans
    WHERE user_id = p_user_id
      AND status IN ('ISSUED', 'OVERDUE');

  IF v_active_loans >= 5 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Member already has the maximum of 5 active loans.';
  END IF;

  SELECT COUNT(*)
    INTO v_unpaid_fines
    FROM fines AS f
    INNER JOIN loans AS l ON l.loan_id = f.loan_id
    WHERE l.user_id = p_user_id
      AND f.paid_status = 'UNPAID';

  IF v_unpaid_fines > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Member has unpaid fines.';
  END IF;

  INSERT INTO loans (user_id, book_id, issued_by, issue_date, due_date, status)
  VALUES (p_user_id, p_book_id, p_admin_id, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'ISSUED');

  UPDATE books
    SET available_copies = available_copies - 1
    WHERE book_id = p_book_id;

  COMMIT;
END$$

CREATE PROCEDURE sp_return_book(IN p_loan_id INT UNSIGNED)
BEGIN
  DECLARE v_book_id INT UNSIGNED;
  DECLARE v_due_date DATE;
  DECLARE v_loan_status VARCHAR(20);
  DECLARE v_locked_book_id INT UNSIGNED;
  DECLARE v_days_overdue INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT book_id, due_date, status
    INTO v_book_id, v_due_date, v_loan_status
    FROM loans
    WHERE loan_id = p_loan_id
    FOR UPDATE;

  IF v_book_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Loan not found.';
  END IF;

  IF v_loan_status = 'RETURNED' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Loan has already been returned.';
  END IF;

  SELECT book_id
    INTO v_locked_book_id
    FROM books
    WHERE book_id = v_book_id
    FOR UPDATE;

  UPDATE loans
    SET return_date = CURDATE(), status = 'RETURNED'
    WHERE loan_id = p_loan_id;

  UPDATE books
    SET available_copies = available_copies + 1
    WHERE book_id = v_book_id;

  IF CURDATE() > v_due_date THEN
    SET v_days_overdue = DATEDIFF(CURDATE(), v_due_date);

    INSERT INTO fines (loan_id, amount, days_overdue, paid_status)
    VALUES (p_loan_id, v_days_overdue * 0.50, v_days_overdue, 'UNPAID');
  END IF;

  COMMIT;
END$$

DELIMITER ;
