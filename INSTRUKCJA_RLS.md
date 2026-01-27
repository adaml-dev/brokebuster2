# 🔧 Instrukcja naprawy problemu z RLS w Supabase

## 🐛 Problem
Po włączeniu Row Level Security (RLS) w Supabase:
- Zniknęło drzewo kategorii po lewej stronie dashboardu
- Pole filtrowania kategorii nie działa
- Przyciski zwijania/rozwijania drzewa kategorii nie działają

## ✅ Rozwiązanie
Problem wynika z braku polityk RLS dla tabel. Po włączeniu RLS, wszystkie tabele są domyślnie zablokowane i trzeba dla nich utworzyć polityki dostępu.

---

## 📝 Instrukcja krok po kroku

### KROK 1: Otwórz Supabase Dashboard
1. Przejdź do: https://supabase.com/dashboard
2. Zaloguj się na swoje konto
3. Wybierz projekt **BrokeBuster2** (lub jak się nazywa Twój projekt)

### KROK 2: Otwórz SQL Editor
1. W lewym menu kliknij **SQL Editor**
2. Kliknij przycisk **New query** (lub **+ New Query**)

### KROK 3: Skopiuj i wklej skrypt SQL
1. Otwórz plik: `supabase_rls_policies.sql` (znajduje się w głównym folderze projektu)
2. **Skopiuj CAŁĄ zawartość pliku**
3. Wklej ją do okna SQL Editor w Supabase

### KROK 4: Uruchom skrypt
1. Kliknij przycisk **Run** (lub naciśnij `Ctrl+Enter` / `Cmd+Enter`)
2. Poczekaj na potwierdzenie wykonania
3. Sprawdź czy nie ma błędów (powinno pokazać "Success")

### KROK 5: Zweryfikuj utworzone polityki
1. W lewym menu kliknij **Authentication** → **Policies**
2. Sprawdź czy dla każdej tabeli są 4 polityki:
   - ✅ **categories** - 4 polityki (SELECT, INSERT, UPDATE, DELETE)
   - ✅ **transactions** - 4 polityki (SELECT, INSERT, UPDATE, DELETE)
   - ✅ **accounts** - 4 polityki (SELECT, INSERT, UPDATE, DELETE)
   - ✅ **categorization_rules** - 4 polityki (SELECT, INSERT, UPDATE, DELETE)
   - ✅ **adam_weight_logs** - 4 polityki (SELECT, INSERT, UPDATE, DELETE)

### KROK 6: Odśwież aplikację
1. Wróć do aplikacji BrokeBuster2
2. **Odśwież stronę** (F5 lub Ctrl+R)
3. Zaloguj się ponownie jeśli trzeba
4. Sprawdź czy drzewo kategorii się pojawia

---

## 🎯 Co robi ten skrypt?

Skrypt tworzy polityki RLS, które pozwalają **zalogowanym użytkownikom** (`authenticated`):
- **Czytać** (SELECT) wszystkie rekordy
- **Dodawać** (INSERT) nowe rekordy
- **Aktualizować** (UPDATE) istniejące rekordy
- **Usuwać** (DELETE) rekordy

To znaczy, że każdy zalogowany użytkownik ma pełny dostęp do swoich danych.

---

## 🔒 Bezpieczeństwo

**UWAGA:** Obecne polityki pozwalają wszystkim zalogowanym użytkownikom widzieć i modyfikować WSZYSTKIE dane.

Jeśli w przyszłości będzie więcej użytkowników, powinieneś:
1. Dodać kolumnę `user_id` do każdej tabeli
2. Zmodyfikować polityki aby użytkownicy widzieli tylko SWOJE dane

Przykład bardziej restrykcyjnej polityki:
```sql
-- Tylko własne dane
CREATE POLICY "Users can read own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

Ale na razie, dla jednego użytkownika, obecne polityki są OK.

---

## ❓ Co jeśli coś poszło nie tak?

### Problem: "policy already exists"
**Rozwiązanie:** Polityki już istnieją. To dobrze! Możesz je pominąć.

### Problem: Nadal nie widać kategorii
**Rozwiązanie:**
1. Sprawdź w Network tab w DevTools czy request do Supabase zwraca dane
2. Sprawdź Console tab czy są błędy
3. Wyloguj się i zaloguj ponownie
4. Wyczyść cache przeglądarki

### Problem: Chcę zacząć od nowa
**Rozwiązanie:**
1. W pliku `supabase_rls_policies.sql` na końcu jest sekcja "OPCJONALNE"
2. Odkomentuj komendy `DROP POLICY`
3. Uruchom je w SQL Editor
4. Następnie uruchom główny skrypt ponownie

---

## 📞 Potrzebujesz pomocy?

Jeśli nadal masz problem:
1. Sprawdź w Supabase → Table Editor czy tabele mają włączony RLS (powinny mieć)
2. Sprawdź w Supabase → Authentication → Policies czy polityki są aktywne
3. Sprawdź w przeglądarce Console czy są błędy JavaScript
4. Sprawdź czy jesteś zalogowany do aplikacji

---

**Powodzenia! 🚀**
