# Transaction Import Logic Documentation

This document describes the logic for importing transactions from three different CSV formats: mBank, ING, and Pekao. The entire import process, from file parsing to data transformation, is handled on the client-side. The backend only provides a simple API endpoint to receive the processed data and insert it into the database.

## Overview

The import process can be summarized as follows:

1.  **File Upload:** The user uploads a CSV file through the web interface.
2.  **Client-Side Parsing:** The frontend, using the `papaparse` library, reads and parses the CSV file.
3.  **Bank Detection:** The client-side code attempts to automatically detect the bank of origin (mBank, ING, or Pekao) based on the file's content.
4.  **Column Mapping:** The user is presented with a preview of the data and is asked to map the CSV columns to the required transaction fields (Date, Amount, Payee, Description).
5.  **Data Transformation:** The frontend code normalizes the data, including date formats and numeric values.
6.  **API Request:** The transformed data, in JSON format, is sent to a backend API endpoint.
7.  **Database Insertion:** The backend receives the JSON data and performs a bulk insert into the `transactions` table.

## Frontend Logic

The entire CSV processing logic resides in the `client/src/pages/import.tsx` file.

### File Upload and Parsing

-   The user selects a CSV file using a standard file input.
-   The `handleFileUpload` function reads the file using `FileReader`.
-   The application supports both `UTF-8` and `windows-1250` encodings, which the user can switch between.
-   The `Papa.parse` function is used to parse the CSV content. A semicolon (`;`) is used as the delimiter.

### Bank Origin Detection

The `detectBankOrigin` function inspects the first 10 rows of the CSV file for keywords that indicate the bank of origin:

-   **mBank:** "mbank" or "multibank"
-   **ING:** "ing bank" or "ing"
-   **Pekao:** "pekao" or "bank pekao"

This detection is used to suggest a default origin to the user, but the user can override it.

### Column Mapping

The user interface allows the user to manually map the columns from their CSV file to the following transaction fields:

-   Date (required)
-   Amount (required)
-   Payee
-   Description

The user can also specify the number of header rows to skip.

### Data Normalization and Transformation

-   **Date Normalization:** The `normalizeDate` function converts various date formats (`DD.MM.YYYY`, `DD-MM-YYYY`, `DD/MM/YYYY`) into the `YYYY-MM-DD` format required by the database.

-   **Amount Cleaning:** The amount value is cleaned by:
    -   Removing the " PLN" currency symbol.
    -   Removing any whitespace.
    -   Replacing commas (`,`) with dots (`.`) to ensure correct float parsing.

## Backend Logic

The backend logic is straightforward and is handled by a single API endpoint.

### API Endpoint

-   **Endpoint:** `POST /api/transactions/bulk`
-   **File:** `server/routes.ts`

This endpoint accepts an array of transaction objects in JSON format.

### Data Insertion

The route handler for `POST /api/transactions/bulk` takes the array of transactions from the request body and uses the `supabase` client to perform a bulk `insert` operation into the `transactions` table.

The code for this is in `server/routes.ts`:

```typescript
app.post("/api/transactions/bulk", async (req, res) => {
  const dbInserts = Array.isArray(req.body)
    ? req.body.map((transaction: any) => { ... })
    : [];

  const { data, error } = await supabase
    .from("transactions")
    .insert(dbInserts)
    .select();

  // ... error handling and response
});
```

## Recreating the Logic

To recreate the transaction import functionality in another application, you would need to:

1.  **Implement a CSV parsing solution** on your frontend, similar to the one using `papaparse` in `client/src/pages/import.tsx`.
2.  **Create a user interface** that allows users to upload files, select encodings, skip rows, and map columns.
3.  **Replicate the data normalization logic**, especially for dates and amounts, to ensure the data is in a consistent format.
4.  **Implement a backend endpoint** that can accept an array of transactions in JSON format.
5.  **Write the database logic** to perform a bulk insert of the received transactions into your `transactions` table.

By following the patterns described in this document, you can successfully replicate the CSV import functionality.
