const axios = require('axios');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { getTokenForShop } = require('../utils/shopify');

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

function verifyHmac(query) {
    const { hmac, ...rest } = query;
    const queryString = Object.keys(rest)
        .sort()
        .map((key) => `${key}=${rest[key]}`)
        .join('&');

    const hash = crypto
        .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
        .update(queryString)
        .digest('hex');

    return hash === hmac;
}

async function getAccessToken(shop, code) {
    const response = await axios.post(`https://${shop}/admin/oauth/access_token`, {
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
    });

    return response.data.access_token;
}

async function storeToken(shop, accessToken) {
    const { data, error } = await supabase
        .from('shop_tokens')
        .upsert({ shop, access_token: accessToken }, { onConflict: 'shop' });

    if (error) {
        console.error('Error storing token:', error);
        throw new Error('Database error');
    }

    console.log(`Token stored for shop: ${shop}`);
}

exports.handler = async (event) => {
    const query = event.queryStringParameters;

    if (!verifyHmac(query)) {
        return {
            statusCode: 400,
            body: 'Invalid HMAC',
        };
    }

    try {
        const accessToken = await getAccessToken(query.shop, query.code);

        // Store the token in Supabase
        await storeToken(query.shop, accessToken);

        return {
            statusCode: 302,
            headers: {
                Location: `https://${query.shop}/admin/apps`,
            },
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: 'Internal Server Error',
        };
    }
};
