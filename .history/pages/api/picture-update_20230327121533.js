import Bynder from "@bynder/bynder-js-sdk";
import getRawBody from "raw-body";
import crypto from "crypto";
console.log("file running")

//first create a `bynder instance` since we are using Bynder sdk'
const bynder = new Bynder({
  baseURL: "https://balr.getbynder.com/api/",
  permanentToken: process.env.BYNDER_PERMANENT_TOKEN,
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
            "X-Shopify-Access-Token": process.env.ACCESS_BOUTIQUE_TOKEN,
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
export default async function (req, res) {
  console.log("running?? ", req, res)
  
}

// We turn off the default bodyParser provided by Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};
