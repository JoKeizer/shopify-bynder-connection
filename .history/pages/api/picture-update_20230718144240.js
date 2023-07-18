import Bynder from "@bynder/bynder-js-sdk";
import getRawBody from "raw-body";
import crypto from "crypto";
import fetch from "node-fetch";

var SHOPIFY_BOUTIQUE_SECRET = "b782e667dfae0f2c853d115d8332c99a"
var ACCESS_BOUTIQUE_TOKEN="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"
var ACCESS_API_KEY = "5a81e93d7a4bbf99a6cc2f977f76175d"
var BYNDER_PERMANENT_TOKEN = "9eeda299b4a287dbf755d689bf69b2f8dfc2ece4ecaf08c1aba7b5b9367bf5bd"
var ACCESS_BOOMI = "anVyYW15YnYtUzk5NjFEOmEzNTczZWIzLTkxZDQtNDBlYS1hZDM3LTU4ZGJkZTVjODhmNg=="
var SECRETTEST = "1120d740c09533810b70f023a9726fe93b66ebc33e411f060bb2bd598ed7731d"


//first create a `bynder instance` since we are using Bynder sdk'
const bynder = new Bynder({
  baseURL: "https://balr.getbynder.com/api/v4/media",
  permanentToken: BYNDER_PERMANENT_TOKEN,
});






  


//this is the asyncronous function that takes care of posting the pictures to bynder  (it gets called on line 93)
async function pushImagesToShopify(images, productId) {
  console.log("push images to shoify")
  for (let i = 0; i < images.length; i++) {
    try {
      const response = await fetch(
        `https://boutique-store-balr.myshopify.com/admin/api/2022-07/products/${productId}/images.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": ACCESS_BOUTIQUE_TOKEN,
          },
          body: JSON.stringify({
            image: {
              src: images[i],
            },
          }),
        }
      );
      const data = await response.json();
      console.info(
        `Processed image ${images[i]} for product ${productId}:`,
        data
      );
    } catch (err) {
      console.error("Error fetching", err);
    }
  }
}


//this is the `serverless function` that takes care of the communication between shopify's webhook and bynder service
export default async function fetchDataBynder(req, res) {
  try {
    fetch("http://3.249.90.128:9090/ws/simple/getProductUpdateWebhook",
  {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization":  `Basic ${ACCESS_BOOMI}`,
    },
    body: JSON.stringify({
      Shopify: {
        reg: req.headers["X-Shopify-Hmac-Sha256"],
      },
    }),
  })
    .then((response) => response.json())
    .then((json) => console.log(json));
  
  } catch (err) {
    console.error("Error fetching", err);
  }
  // We need to await the Stream to receive the complete body Buffer
  const body = await getRawBody(req);
  // Get the header from the request
  const hmacHeader = req.headers["X-Shopify-Hmac-Sha256"];
  // Digest the data into a hmac hash
  const digest = crypto
    .createHmac("sha256", SECRETTEST)
    .update(body)
    .digest("base64");
  // Compare the result with the header, we do this to make sure the request is coming from a shopify webhook
  if (digest === hmacHeader) {
    const productData = JSON.parse(body); //find the bynderId tag
    const productId = productData.id;
    const productTags = productData.tags.split(",");
    const bynderTag = productTags.find((tag) => tag.includes("bynder_id"));

    if (!bynderTag) {
      return res
        .status(500)
        .json({ message: "Product does not have a Bynder ID" }); //no tag available
    }

    // Checking if the product has images already, in case we run this script on product update
    //this is necessary because on product update, the image uploads would edit the product, retriggering the webhook
    if (productData.images.length) {
      return res.status(500).json({ message: "Product already has images" });
    }

    const bynderId = bynderTag.split(":")[1];
    console.log("bynder id:", bynderId);

    //get only the images which name matches the bynderId followed by an underscore
    bynder
      .getMediaList({
        keyword: `${bynderId}_`,
      })
      .then(async (data) => {
        if (data) {
          // sort the images by name, then only grab the ones which thumbnail includes Shopify or the default online thumbnail
          const images = data
            .sort((a, b) => (a.name > b.name ? 1 : -1))
            .map(
              (img) =>
                img.thumbnails ? img.thumbnails.Shopify : img.thumbnails.online //whatever thumbnail is used, it needs to be public in Bynder (little world icon next to the preset name)
            )
            .filter((img) => img !== null);

          if (!images) {
            return res.status(200).json({
              message: `There are no images that are useful for shopify for product ${productId}`,
            });
          }

          await pushImagesToShopify(images, productId);
          
          console.info(`Product ${productId} updated`);
          return res
            .status(200)
            .json({ message: `Product ${productId} updated` });
        } else {
          console.error("Error", {
            message: `No images in Bynder for ${productId}`,
          });
          return res
            .status(500)
            .json({ message: `No images in Bynder for ${productId}` });
        }
      })
      .catch((error) => {
        console.error("Error in bynder", { ...error });
        return res.status(500).json({ ...error });
      });
  } else {
    // INVALID - Respond with 401 Unauthorized, the call does not come from shopify and could be an attempt to inject stuff on our store/
    console.info("invalid request");
    return res.status(401).json({ message: "Unauthorized Jo test" });
  }
}

// We turn off the default bodyParser provided by Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};



