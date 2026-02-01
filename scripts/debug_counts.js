const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1]] = match[2].trim().replace(/(^"|"$)/g, '').replace(/(^'|'$)/g, '');
});

const serviceRoleKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];
const anonKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], serviceRoleKey || anonKey);

async function main() {
    console.log("Searching for category: 'Kocie żarcie'...");

    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*');

    if (catError) {
        console.error("Error categories:", catError);
    } else {
        console.log(`Total Categories: ${categories.length}`);
        categories.forEach(c => console.log(`"${c.name}" - ${c.id}`));
    }
    return;

    // 2. Count transactions for these IDs
    for (const cat of categories) {
        console.log(`\nChecking transactions for Category ID: ${cat.id}`);
        const { count, error: txError } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('category', cat.id);

        if (txError) console.error("Error counting tx:", txError);
        else console.log(` -> Count in DB: ${count}`);

        // Let's also check if maybe they are assigned to a DIFFERENT ID but with same name?
        // Or specific transaction dump?
        const { data: sampleTx } = await supabase.from('transactions').select('id, description, category').eq('category', cat.id).limit(3);
        if (sampleTx && sampleTx.length > 0) {
            console.log("Sample Transactions:", sampleTx);
        }
    }

    // 3. Global check for similar names in Transactions if ID mismatch?
    // Unlikely if it's a UUID foreign key, but maybe text?
    // Let's check type of category column in transactions

}

main().catch(console.error);
