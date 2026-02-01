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

if (!serviceRoleKey) {
    console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY not found in .env.local. RLS policies may block execution.");
}

const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], serviceRoleKey || anonKey);

async function main() {
    console.log("Starting API Verification (JS)...");

    // 1. Create a Test Category
    const { data: cat1, error: err1 } = await supabase.from('categories').insert({ name: 'Test Root 1', order: 0 }).select().single();
    if (err1) throw err1;
    console.log("Created Cat 1:", cat1.id);

    const { data: cat2, error: err2 } = await supabase.from('categories').insert({ name: 'Test Root 2', order: 1 }).select().single();
    if (err2) throw err2;
    console.log("Created Cat 2:", cat2.id);

    // 2. Test Reorder (Swap order)
    console.log("Testing Reorder...");

    await supabase.from('categories').update({ order: 1 }).eq('id', cat1.id);
    await supabase.from('categories').update({ order: 0 }).eq('id', cat2.id);

    const { data: refetched } = await supabase.from('categories').select('id, order').in('id', [cat1.id, cat2.id]);
    const r1 = refetched.find(c => c.id === cat1.id);
    const r2 = refetched.find(c => c.id === cat2.id);

    if (r1.order === 1 && r2.order === 0) {
        console.log("Reorder Logic Verified (Simulated).");
    } else {
        console.error("Reorder Logic Failed", refetched);
    }

    // 3. Test Migration Logic
    console.log("Testing Migration Logic...");

    // Add transaction to cat1 (now order 1)
    const { data: tx, error: txErr } = await supabase.from('transactions').insert({
        amount: 100,
        date: '2025-01-01',
        transaction_type: 'planned',
        category: cat1.id, // Assign to 'cat1'
        description: 'Test Migration Tx'
    }).select().single();

    if (txErr) console.error("Tx Create Error", txErr);
    else console.log("Created Tx for Cat 1");

    if (tx) {
        // Now "Migrate" cat1 to be a parent.
        const { data: newChild } = await supabase.from('categories').insert({ name: 'New Child', parent: cat1.id }).select().single();
        if (newChild) {
            const { error: moveErr } = await supabase.from('transactions').update({ category: newChild.id }).eq('category', cat1.id);
            if (!moveErr) {
                // Verify
                const { data: verTx } = await supabase.from('transactions').select('category').eq('id', tx.id).single();
                if (verTx.category === newChild.id) {
                    console.log("Migration Logic Verified: Tx moved to new child.");
                } else {
                    console.error("Migration Failed: Tx not moved.", verTx);
                }
            } else {
                console.error("Move Error:", moveErr);
            }
        } else {
            console.error("Failed to create child");
        }
    }

    // Cleanup
    console.log("Cleaning up...");
    if (tx) await supabase.from('transactions').delete().eq('id', tx.id);

    // Delete children first
    const { data: children } = await supabase.from('categories').select('id').eq('parent', cat1.id);
    if (children) {
        for (const c of children) {
            await supabase.from('categories').delete().eq('id', c.id);
        }
    }

    await supabase.from('categories').delete().eq('id', cat2.id);
    await supabase.from('categories').delete().eq('id', cat1.id);
    console.log("Cleanup Done.");
}

main().catch(console.error);
