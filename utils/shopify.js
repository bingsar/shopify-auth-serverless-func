const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Utility function to get the token for a specific shop
async function getTokenForShop(shop) {
    const { data, error } = await supabase
        .from('shop_tokens')
        .select('access_token')
        .eq('shop', shop)
        .single();

    if (error) {
        console.error('Error fetching token:', error);
        return null;
    }

    return data.access_token;
}

module.exports = { getTokenForShop };
