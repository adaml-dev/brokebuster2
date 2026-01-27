# 🔧 Naprawa problemu z RLS w Supabase

## 📋 Problem
Po włączeniu RLS (Row Level Security) w Supabase:
- ❌ Zniknęło drzewo kategorii z lewej strony dashboardu
- ❌ Nie działają przyciski rozwijania/zwijania drzewa
- ❌ Pole filtrowania kategorii nie działa

## 🎯 Przyczyna
Włączenie RLS bez utworzenia odpowiednich polityk blokuje dostęp do danych w tabelach. Aplikacja nie może pobrać kategorii, transakcji i innych danych, więc dashboard jest pusty.

## ✅ Rozwiązanie

### Krok 1: Otwórz Supabase Dashboard
1. Zaloguj się do [Supabase Dashboard](https://supabase.com/dashboard)
2. Wybierz swój projekt: **brrjspesgzucdoymiowk**

### Krok 2: Przejdź do SQL Editor
1. W lewym menu kliknij **SQL Editor**
2. Kliknij przycisk **New query**

### Krok 3: Skopiuj i wykonaj polityki RLS
1. Otwórz plik: `supabase-rls-policies.sql` (znajduje się w głównym katalogu projektu)
2. Skopiuj **całą** zawartość pliku
3. Wklej do SQL Editor w Supabase
4. Kliknij przycisk **Run** (lub naciśnij `Ctrl+Enter`)

### Krok 4: Sprawdź wyniki
- ✅ Powinieneś zobaczyć komunikaty o udanych operacjach
- ⚠️ Jeśli zobaczysz błędy dotyczące nieistniejących tabel - to normalne, zignoruj je

### Krok 5: Odśwież aplikację
1. Wróć do aplikacji BrokeBuster
2. Naciśnij `F5` lub `Ctrl+R` aby odświeżyć stronę
3. 🎉 Drzewo kategorii powinno się pojawić!

## 🔍 Co robi ten skrypt?

Skrypt tworzy polityki RLS dla następujących tabel:
- ✅ `categories` - kategorie
- ✅ `transactions` - transakcje
- ✅ `accounts` - konta
- ✅ `adam_weight_logs` - logi wagi
- ✅ `categorization_rules` - reguły kategoryzacji
- ✅ `account_statements` - wyciągi z kont

Każda polityka pozwala zalogowanym użytkownikom na:
- 👀 **SELECT** - odczytywanie danych
- ➕ **INSERT** - dodawanie nowych rekordów
- ✏️ **UPDATE** - edycję istniejących rekordów
- 🗑️ **DELETE** - usuwanie rekordów

## ⚠️ WAŻNE UWAGI

### Polityki dla wielu użytkowników
Obecnie polityki pozwalają **wszystkim zalogowanym użytkownikom** na dostęp do **wszystkich danych**.

Jeśli chcesz, aby każdy użytkownik widział tylko swoje dane:

1. **Dodaj kolumnę `user_id` do tabel:**
```sql
ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- itd. dla każdej tabeli
```

2. **Zmień polityki na:**
```sql
-- Przykład dla categories
DROP POLICY "Users can view all categories" ON categories;

CREATE POLICY "Users can view own categories"
ON categories
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### Weryfikacja polityk
Możesz sprawdzić utworzone polityki:
1. W Supabase Dashboard przejdź do **Authentication** → **Policies**
2. Wybierz tabelę (np. `categories`)
3. Powinieneś zobaczyć listę polityk

### Usuwanie polityk (jeśli potrzebne)
Jeśli chcesz usunąć polityki i zacząć od nowa:

```sql
-- Dla każdej tabeli:
DROP POLICY IF EXISTS "Users can view all categories" ON categories;
DROP POLICY IF EXISTS "Users can insert categories" ON categories;
DROP POLICY IF EXISTS "Users can update categories" ON categories;
DROP POLICY IF EXISTS "Users can delete categories" ON categories;
```

## 🐛 Rozwiązywanie problemów

### Problem: Nadal nie widzę danych po wykonaniu skryptu
**Rozwiązanie:**
1. Sprawdź czy jesteś zalogowany w aplikacji
2. Wyloguj się i zaloguj ponownie
3. Wyczyść cache przeglądarki (`Ctrl+Shift+Delete`)
4. Sprawdź w Supabase Dashboard czy polityki zostały utworzone

### Problem: Błąd "policy already exists"
**Rozwiązanie:**
- To normalne, jeśli wykonujesz skrypt drugi raz
- Najpierw usuń istniejące polityki (patrz sekcja powyżej)
- Lub zignoruj błąd - polityki nadal będą działać

### Problem: Błąd "relation does not exist"
**Rozwiązanie:**
- Oznacza to, że tabela nie istnieje w bazie danych
- To normalne - po prostu usuń lub zakomentuj sekcję dla tej tabeli w skrypcie

## 📞 Potrzebujesz pomocy?
Jeśli nadal masz problemy, sprawdź:
- Logi w konsoli przeglądarki (`F12` → `Console`)
- Logi w Supabase Dashboard → Logs → Postgres Logs

---

**Utworzono:** 27.01.2026  
**Wersja:** 1.0
