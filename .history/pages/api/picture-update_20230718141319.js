

var SHOPIFY_BOUTIQUE_SECRET = "b782e667dfae0f2c853d115d8332c99a"
var ACCESS_BOUTIQUE_TOKEN="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"
var ACCESS_API_KEY = "5a81e93d7a4bbf99a6cc2f977f76175d"
var BYNDER_PERMANENT_TOKEN = "9eeda299b4a287dbf755d689bf69b2f8dfc2ece4ecaf08c1aba7b5b9367bf5bd"
var ACCESS_BOOMI = "anVyYW15YnYtUzk5NjFEOmEzNTczZWIzLTkxZDQtNDBlYS1hZDM3LTU4ZGJkZTVjODhmNg=="



import getRawBody from 'raw-body'
import crypto from "crypto"

export default async function (req, res) {
  // We need to await the Stream to receive the complete body Buffer
  const body = await getRawBody(req)
  // Get the header from the request
  const hmacHeader = req.headers['x-shopify-hmac-sha256']
  // Digest the data into a hmac hash
  const digest = crypto
    .createHmac('sha256', SHOPIFY_BOUTIQUE_SECRET)
    .update(body)
    .digest('base64')
  // Compare the result with the header
  if (digest === hmacHeader) {
    // VALID - continue with your tasks
    res.status(200).end()
  } else {
    // INVALID - Respond with 401 Unauthorized
    res.status(401).end()
  }
}

// We turn off the default bodyParser provided by Next.js
export const config = {
  api: {
    bodyParser: false,
  },
}