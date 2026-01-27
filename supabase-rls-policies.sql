-- ========================================
-- RLS POLICIES FOR BROKEBUSTER2
-- ========================================
-- Te polityki pozwalają zalogowanym użytkownikom na dostęp do ich własnych danych
-- Wykonaj ten skrypt w Supabase SQL Editor

-- ========================================
-- KATEGORIE (categories)
-- ========================================

-- Włącz RLS dla tabeli categories (jeśli jeszcze nie jest włączony)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Polityka pozwalająca na odczyt wszystkich kategorii dla zalogowanych użytkowników
CREATE POLICY "Users can view all categories"
ON categories
FOR SELECT
TO authenticated
USING (true);

-- Polityka pozwalająca na INSERT dla zalogowanych użytkowników
-- (jeśli tabela ma kolumnę user_id, dodaj: WITH CHECK (auth.uid() = user_id))
CREATE POLICY "Users can insert categories"
ON categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Polityka pozwalająca na UPDATE dla zalogowanych użytkowników
CREATE POLICY "Users can update categories"
ON categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Polityka pozwalająca na DELETE dla zalogowanych użytkowników
CREATE POLICY "Users can delete categories"
ON categories
FOR DELETE
TO authenticated
USING (true);


-- ========================================
-- TRANSAKCJE (transactions)
-- ========================================

-- Włącz RLS dla tabeli transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Polityka pozwalająca na odczyt wszystkich transakcji dla zalogowanych użytkowników
-- Jeśli masz kolumnę user_id, zmień na: USING (auth.uid() = user_id)
CREATE POLICY "Users can view all transactions"
ON transactions
FOR SELECT
TO authenticated
USING (true);

-- Polityka pozwalająca na INSERT
CREATE POLICY "Users can insert transactions"
ON transactions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Polityka pozwalająca na UPDATE
CREATE POLICY "Users can update transactions"
ON transactions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Polityka pozwalająca na DELETE
CREATE POLICY "Users can delete transactions"
ON transactions
FOR DELETE
TO authenticated
USING (true);


-- ========================================
-- KONTA (accounts)
-- ========================================

-- Włącz RLS dla tabeli accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Polityka pozwalająca na odczyt wszystkich kont dla zalogowanych użytkowników
CREATE POLICY "Users can view all accounts"
ON accounts
FOR SELECT
TO authenticated
USING (true);

-- Polityka pozwalająca na INSERT
CREATE POLICY "Users can insert accounts"
ON accounts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Polityka pozwalająca na UPDATE
CREATE POLICY "Users can update accounts"
ON accounts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Polityka pozwalająca na DELETE
CREATE POLICY "Users can delete accounts"
ON accounts
FOR DELETE
TO authenticated
USING (true);


-- ========================================
-- LOGI WAGI (adam_weight_logs)
-- ========================================

-- Włącz RLS dla tabeli adam_weight_logs
ALTER TABLE adam_weight_logs ENABLE ROW LEVEL SECURITY;

-- Polityka pozwalająca na odczyt
CREATE POLICY "Users can view weight logs"
ON adam_weight_logs
FOR SELECT
TO authenticated
USING (true);

-- Polityka pozwalająca na INSERT
CREATE POLICY "Users can insert weight logs"
ON adam_weight_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Polityka pozwalająca na UPDATE
CREATE POLICY "Users can update weight logs"
ON adam_weight_logs
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Polityka pozwalająca na DELETE
CREATE POLICY "Users can delete weight logs"
ON adam_weight_logs
FOR DELETE
TO authenticated
USING (true);


-- ========================================
-- REGUŁY KATEGORYZACJI (categorization_rules)
-- ========================================

-- Włącz RLS dla tabeli categorization_rules
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;

-- Polityka pozwalająca na odczyt
CREATE POLICY "Users can view categorization rules"
ON categorization_rules
FOR SELECT
TO authenticated
USING (true);

-- Polityka pozwalająca na INSERT
CREATE POLICY "Users can insert categorization rules"
ON categorization_rules
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Polityka pozwalająca na UPDATE
CREATE POLICY "Users can update categorization rules"
ON categorization_rules
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Polityka pozwalająca na DELETE
CREATE POLICY "Users can delete categorization rules"
ON categorization_rules
FOR DELETE
TO authenticated
USING (true);


-- ========================================
-- ACCOUNT_STATEMENTS (jeśli istnieje)
-- ========================================

-- Włącz RLS dla tabeli account_statements (jeśli istnieje)
ALTER TABLE account_statements ENABLE ROW LEVEL SECURITY;

-- Polityka pozwalająca na odczyt
CREATE POLICY "Users can view account statements"
ON account_statements
FOR SELECT
TO authenticated
USING (true);

-- Polityka pozwalająca na INSERT
CREATE POLICY "Users can insert account statements"
ON account_statements
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Polityka pozwalająca na UPDATE
CREATE POLICY "Users can update account statements"
ON account_statements
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Polityka pozwalająca na DELETE
CREATE POLICY "Users can delete account statements"
ON account_statements
FOR DELETE
TO authenticated
USING (true);


-- ========================================
-- UWAGI I INFORMACJE
-- ========================================

-- UWAGA 1: Te polityki pozwalają WSZYSTKIM zalogowanym użytkownikom na dostęp do WSZYSTKICH danych.
-- Jeśli chcesz, aby każdy użytkownik widział tylko swoje dane, musisz:
-- 1. Dodać kolumnę user_id do każdej tabeli
-- 2. Zmienić polityki na: USING (auth.uid() = user_id)

-- UWAGA 2: Jeśli niektóre tabele nie istnieją, Supabase zignoruje te komendy z błędem.
-- To jest OK - po prostu usuń lub zakomentuj sekcje dla nieistniejących tabel.

-- UWAGA 3: Po wykonaniu tego skryptu, odśwież stronę dashboardu aby zobaczyć efekty.

-- ========================================
-- JAK UŻYĆ TEGO SKRYPTU:
-- ========================================
-- 1. Zaloguj się do Supabase Dashboard
-- 2. Przejdź do SQL Editor
-- 3. Skopiuj i wklej cały ten skrypt
-- 4. Kliknij "Run" aby wykonać
-- 5. Odśwież stronę aplikacji
