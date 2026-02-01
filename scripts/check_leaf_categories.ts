
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    // Load .env.local manually
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('.env.local not found');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            // Remove quotes if present
            let value = match[2].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            envVars[match[1]] = value;
        }
    });

    const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase URL or Key');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching categories and transactions...');

    // Fetch all categories
    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name, parent');

    if (catError) {
        console.error('Error fetching categories:', catError);
        return;
    }

    if (!categories) {
        console.log("No categories found");
        return;
    }

    // Fetch all transactions
    const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('id, description, category, date');

    if (txError) {
        console.error('Error fetching transactions:', txError);
        return;
    }

    if (!transactions) {
        console.log("No transactions found");
        return;
    }

    // Identify Parent IDs (categories that are parents of other categories)
    const parentIds = new Set<string>();
    categories.forEach((cat: any) => {
        if (cat.parent) {
            parentIds.add(cat.parent);
        }
    });

    console.log(`Total Categories: ${categories.length}`);
    console.log(`Parent Categories (should NOT have transactions): ${parentIds.size}`);
    console.log(`Total Transactions: ${transactions.length}`);

    let violations = 0;
    transactions.forEach((tx: any) => {
        if (tx.category && parentIds.has(tx.category)) {
            const cat = categories.find((c: any) => c.id === tx.category);
            const catName = cat ? cat.name : 'Unknown';
            console.log(`VIOLATION: Transaction '${tx.description}' (${tx.date}) is assigned to parent category: ${catName} (ID: ${tx.category})`);
            violations++;
        }
    });

    if (violations === 0) {
        console.log('SUCCESS: No transactions are assigned to parent categories.');
    } else {
        console.log(`FAILURE: Found ${violations} violations.`);
    }
}

main().catch(console.error);
