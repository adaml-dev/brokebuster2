# Auto-Categorization Page Logic

This document provides a detailed breakdown of the functionality on the "Auto-Categorization" page, as implemented in `client/src/pages/auto-categorization.tsx`.

## 1. Page Overview

The Auto-Categorization page allows users to create rules that automatically assign categories to transactions based on keyword matching in the Payee or Description fields. This feature helps automate the categorization process for recurring transactions.

## 2. Data Fetching and State Management

- **Data Fetching:** The component uses `@tanstack/react-query` to fetch data:
  - `useQuery({ queryKey: ["/api/categories"] })` - Fetches all categories
  - `useQuery({ queryKey: ["/api/categorization-rules"] })` - Fetches all categorization rules
- **Mutations:** The component uses `useMutation` for:
  - Creating new rules
  - Deleting rules
  - Applying rules to transactions
- **State Management:** Uses `useState` hooks for managing the "Add Rule" dialog and new rule form data

## 3. Page Layout

The page consists of three main sections arranged vertically:

1. **Header Section** - Title and "Apply Rules Now" button
2. **Categorization Rules Card** - Table displaying all rules with an "Add Rule" button
3. **How It Works Card** - Informational section explaining the feature

## 4. Header Section

### 4.1. Page Title and Description

- **Title:** "Auto-Categorization Rules"
- **Description:** "Create rules to automatically categorize transactions based on keywords found in Payee or Description fields"

### 4.2. Apply Rules Now Button

- **Element:** Green button with Play icon
- **Text:** "Apply Rules Now" (changes to "Applying..." during execution)
- **Functionality:** 
  - Triggers the application of all rules to uncategorized transactions
  - Shows a confirmation dialog before applying
  - Displays error if no rules exist
  - After completion, shows a success message with the count of categorized transactions
  - Updates the transactions data via query invalidation
- **States:**
  - Normal: "Apply Rules Now"
  - Loading: "Applying..." (button disabled)

## 5. Categorization Rules Card

### 5.1. Card Header

- **Title:** "Categorization Rules (X)" where X is the count of existing rules
- **Add Rule Button:** Opens the "Add Rule" dialog

### 5.2. Rules Table

The table displays all categorization rules with the following columns:

#### Columns:

1. **Keyword**
   - The search term to match in transactions
   - Displayed in a monospace font with a styled badge
   
2. **Search In**
   - Indicates whether the keyword should be searched in "Payee" or "Description"
   - Displayed as a colored badge:
     - Blue badge for "Payee"
     - Purple badge for "Description"

3. **Category**
   - The category to assign when the rule matches
   - Displays the category name (looked up from the categories list)

4. **Value Min**
   - Minimum transaction amount for the rule to apply (optional)
   - Displays "-" if not set

5. **Value Max**
   - Maximum transaction amount for the rule to apply (optional)
   - Displays "-" if not set

6. **Date From**
   - Start date for the rule to be active (optional)
   - Displays "-" if not set

7. **Date To**
   - End date for the rule to be active (optional)
   - Displays "-" if not set

8. **Created**
   - The date when the rule was created
   - Displayed in localized date format

9. **Actions**
   - **Delete (Trash Icon):** Deletes the rule after confirmation

#### Empty State:

When no rules exist, the table shows an informational message:
- Tag icon (large, centered)
- "No rules created yet"
- "Create your first rule to start automatically categorizing transactions"

## 6. How It Works Card

This informational card explains the auto-categorization feature in three steps:

### Step 1: Create Rules
- Explains how to define keywords and assign them to categories
- Keywords can be searched in Payee or Description fields

### Step 2: Apply Rules
- Explains the "Apply Rules Now" functionality
- Notes that keyword matching is case-insensitive

### Step 3: Priority
- Explains that only the first matching rule is applied if multiple rules match
- Rules are evaluated from top to bottom in the table

## 7. Add Rule Dialog

### 7.1. Trigger
- Opened by clicking the "Add Rule" button in the card header

### 7.2. Dialog Fields

#### Required Fields (marked with red asterisk):

1. **Keyword**
   - Text input
   - Placeholder: "e.g., Spotify, Netflix, Grocery Store..."
   - Help text: "The keyword to search for (case-insensitive)"

2. **Search In**
   - Dropdown with two options:
     - "Payee"
     - "Description"
   - Help text: "Choose which field to search for the keyword"

3. **Category**
   - Dropdown populated with leaf categories (categories that have no child categories)
   - Placeholder: "Select category..."
   - Help text: "The category to assign when this keyword is found"

#### Optional Fields:

4. **Min Value**
   - Number input
   - Placeholder: "e.g., 10.00"
   - Allows filtering by minimum transaction amount

5. **Max Value**
   - Number input
   - Placeholder: "e.g., 50.00"
   - Allows filtering by maximum transaction amount

6. **Date From**
   - Date picker input
   - Allows setting a start date for when the rule should be active

7. **Date To**
   - Date picker input
   - Allows setting an end date for when the rule should be active

### 7.3. Dialog Actions

- **Cancel Button:** Closes dialog and resets form
- **Add Rule Button:** 
  - Validates that required fields are filled
  - Creates the new rule
  - Shows success/error toast notification
  - Closes dialog and resets form on success
  - Text changes to "Adding..." during submission

## 8. Business Logic

### 8.1. Rule Application Process

When "Apply Rules Now" is clicked:

1. Backend fetches all categorization rules
2. Backend fetches all transactions with `transactionType = "done"` and no category assigned
3. For each uncategorized transaction:
   - Loop through all rules (in order)
   - For each rule:
     - Check if the keyword exists in the specified field (case-insensitive, whitespace-normalized)
     - Check if transaction amount is within min/max range (if specified)
     - Check if transaction date is within date range (if specified)
     - If all conditions match, assign the category and break (only first match applies)

### 8.2. Keyword Matching

- Matching is case-insensitive
- Both the transaction field and the keyword are normalized:
  - All whitespace (spaces, newlines, tabs) are replaced with single spaces
  - Trimmed of leading/trailing whitespace
  - Converted to lowercase
- Uses substring matching (keyword can be anywhere in the field)

### 8.3. Value Constraints

- `valueMin` and `valueMax` are optional
- If specified, the transaction amount must fall within this range
- Both min and max can be set independently

### 8.4. Date Constraints

- `dateFrom` and `dateTo` are optional
- If specified, the transaction date must fall within this range
- Both dates can be set independently

### 8.5. Category Selection

- Only leaf categories (categories without children) can be selected
- This prevents assigning transactions to parent categories that have subcategories

## 9. Backend Integration

The page uses the following API endpoints:

- **Rules:**
  - GET `/api/categorization-rules` - Fetch all rules
  - POST `/api/categorization-rules` - Create new rule
  - DELETE `/api/categorization-rules/:id` - Delete rule
  - POST `/api/categorization-rules/apply` - Apply all rules to transactions

- **Categories:**
  - GET `/api/categories` - Fetch all categories (used for dropdown and category name lookup)

## 10. User Feedback

The page provides feedback through toast notifications for:

- **Success messages:**
  - Rule added successfully
  - Rule deleted successfully
  - Rules applied successfully (with count of categorized transactions)

- **Error messages:**
  - Failed to add rule
  - Failed to delete rule
  - Failed to apply rules
  - Validation errors (missing required fields, no rules to apply)

## 11. Confirmation Dialogs

The page shows browser confirmation dialogs for:

1. **Delete Rule:** "Are you sure you want to delete this rule?"
2. **Apply Rules:** "This will apply all categorization rules to your transactions. Transactions that match a rule will be automatically categorized. Continue?"
