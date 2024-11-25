const axios = require('axios');
const crypto = require('crypto');

exports.handler = async (event) => {
    const { code, shop, hmac } = event.queryStringParameters;

    // Validate HMAC
    const query = Object.keys(event.queryStringParameters)
        .filter((key) => key !== 'hmac')
        .sort()
        .map((key) => `${key}=${event.queryStringParameters[key]}`)
        .join('&');

    const generatedHmac = crypto
        .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
        .update(query)
        .digest('hex');

    if (generatedHmac !== hmac) {
        return {
            statusCode: 400,
            body: 'Invalid HMAC',
        };
    }

    // Exchange code for access token
    try {
        const response = await axios.post(
            `https://${shop}/admin/oauth/access_token`,
            {
                client_id: process.env.SHOPIFY_API_KEY,
                client_secret: process.env.SHOPIFY_API_SECRET,
                code,
            }
        );

        const accessToken = response.data.access_token;

        console.log(`Access Token for ${shop}:`, accessToken);

        return {
            statusCode: 200,
            body: 'App installed successfully!',
        };
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        return {
            statusCode: 500,
            body: 'Internal Server Error',
        };
    }
};
