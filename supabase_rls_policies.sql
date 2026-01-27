-- ====================================================================
-- POLITYKI RLS DLA BROKEBUSTER2
-- ====================================================================
-- Ten plik zawiera wszystkie polityki RLS potrzebne do działania aplikacji
-- Po włączeniu RLS w Supabase, uruchom ten skrypt w SQL Editor
-- ====================================================================

-- 1. POLITYKI DLA TABELI: categories
-- ====================================================================
-- Pozwól zalogowanym użytkownikom czytać wszystkie kategorie
CREATE POLICY "Allow authenticated users to read categories"
ON public.categories
FOR SELECT
TO authenticated
USING (true);

-- Pozwól zalogowanym użytkownikom tworzyć kategorie
CREATE POLICY "Allow authenticated users to insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Pozwól zalogowanym użytkownikom aktualizować kategorie
CREATE POLICY "Allow authenticated users to update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Pozwól zalogowanym użytkownikom usuwać kategorie
CREATE POLICY "Allow authenticated users to delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (true);


-- 2. POLITYKI DLA TABELI: transactions
-- ====================================================================
-- Pozwól zalogowanym użytkownikom czytać wszystkie transakcje
CREATE POLICY "Allow authenticated users to read transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (true);

-- Pozwól zalogowanym użytkownikom tworzyć transakcje
CREATE POLICY "Allow authenticated users to insert transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Pozwól zalogowanym użytkownikom aktualizować transakcje
CREATE POLICY "Allow authenticated users to update transactions"
ON public.transactions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Pozwól zalogowanym użytkownikom usuwać transakcje
CREATE POLICY "Allow authenticated users to delete transactions"
ON public.transactions
FOR DELETE
TO authenticated
USING (true);


-- 3. POLITYKI DLA TABELI: accounts
-- ====================================================================
-- Pozwól zalogowanym użytkownikom czytać wszystkie konta
CREATE POLICY "Allow authenticated users to read accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (true);

-- Pozwól zalogowanym użytkownikom tworzyć konta
CREATE POLICY "Allow authenticated users to insert accounts"
ON public.accounts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Pozwól zalogowanym użytkownikom aktualizować konta
CREATE POLICY "Allow authenticated users to update accounts"
ON public.accounts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Pozwól zalogowanym użytkownikom usuwać konta
CREATE POLICY "Allow authenticated users to delete accounts"
ON public.accounts
FOR DELETE
TO authenticated
USING (true);


-- 4. POLITYKI DLA TABELI: categorization_rules
-- ====================================================================
-- Pozwól zalogowanym użytkownikom czytać wszystkie reguły
CREATE POLICY "Allow authenticated users to read categorization_rules"
ON public.categorization_rules
FOR SELECT
TO authenticated
USING (true);

-- Pozwól zalogowanym użytkownikom tworzyć reguły
CREATE POLICY "Allow authenticated users to insert categorization_rules"
ON public.categorization_rules
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Pozwól zalogowanym użytkownikom aktualizować reguły
CREATE POLICY "Allow authenticated users to update categorization_rules"
ON public.categorization_rules
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Pozwól zalogowanym użytkownikom usuwać reguły
CREATE POLICY "Allow authenticated users to delete categorization_rules"
ON public.categorization_rules
FOR DELETE
TO authenticated
USING (true);


-- 5. POLITYKI DLA TABELI: adam_weight_logs
-- ====================================================================
-- Pozwól zalogowanym użytkownikom czytać wszystkie wpisy wagi
CREATE POLICY "Allow authenticated users to read adam_weight_logs"
ON public.adam_weight_logs
FOR SELECT
TO authenticated
USING (true);

-- Pozwól zalogowanym użytkownikom tworzyć wpisy wagi
CREATE POLICY "Allow authenticated users to insert adam_weight_logs"
ON public.adam_weight_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Pozwól zalogowanym użytkownikom aktualizować wpisy wagi
CREATE POLICY "Allow authenticated users to update adam_weight_logs"
ON public.adam_weight_logs
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Pozwól zalogowanym użytkownikom usuwać wpisy wagi
CREATE POLICY "Allow authenticated users to delete adam_weight_logs"
ON public.adam_weight_logs
FOR DELETE
TO authenticated
USING (true);


-- ====================================================================
-- KONIEC POLITYK RLS
-- ====================================================================
-- Po uruchomieniu tego skryptu, odśwież stronę dashboard i wszystko
-- powinno działać poprawnie.
-- ====================================================================


-- ====================================================================
-- OPCJONALNE: Skrypt do usunięcia wszystkich polityk (gdyby potrzebne)
-- ====================================================================
-- Odkomentuj poniższe linie jeśli chcesz usunąć wszystkie polityki
-- i zacząć od nowa:

/*
DROP POLICY IF EXISTS "Allow authenticated users to read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated users to insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated users to update categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete categories" ON public.categories;

DROP POLICY IF EXISTS "Allow authenticated users to read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow authenticated users to insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow authenticated users to update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow authenticated users to delete transactions" ON public.transactions;

DROP POLICY IF EXISTS "Allow authenticated users to read accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow authenticated users to insert accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow authenticated users to update accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow authenticated users to delete accounts" ON public.accounts;

DROP POLICY IF EXISTS "Allow authenticated users to read categorization_rules" ON public.categorization_rules;
DROP POLICY IF EXISTS "Allow authenticated users to insert categorization_rules" ON public.categorization_rules;
DROP POLICY IF EXISTS "Allow authenticated users to update categorization_rules" ON public.categorization_rules;
DROP POLICY IF EXISTS "Allow authenticated users to delete categorization_rules" ON public.categorization_rules;

DROP POLICY IF EXISTS "Allow authenticated users to read adam_weight_logs" ON public.adam_weight_logs;
DROP POLICY IF EXISTS "Allow authenticated users to insert adam_weight_logs" ON public.adam_weight_logs;
DROP POLICY IF EXISTS "Allow authenticated users to update adam_weight_logs" ON public.adam_weight_logs;
DROP POLICY IF EXISTS "Allow authenticated users to delete adam_weight_logs" ON public.adam_weight_logs;
*/
