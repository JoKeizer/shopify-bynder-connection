"use strict";
(() => {
var exports = {};
exports.id = 13;
exports.ids = [13];
exports.modules = {

/***/ 440:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "config": () => (/* binding */ config),
  "default": () => (/* binding */ picture_update)
});

;// CONCATENATED MODULE: external "@bynder/bynder-js-sdk"
const bynder_js_sdk_namespaceObject = require("@bynder/bynder-js-sdk");
var bynder_js_sdk_default = /*#__PURE__*/__webpack_require__.n(bynder_js_sdk_namespaceObject);
;// CONCATENATED MODULE: external "raw-body"
const external_raw_body_namespaceObject = require("raw-body");
var external_raw_body_default = /*#__PURE__*/__webpack_require__.n(external_raw_body_namespaceObject);
;// CONCATENATED MODULE: external "crypto"
const external_crypto_namespaceObject = require("crypto");
var external_crypto_default = /*#__PURE__*/__webpack_require__.n(external_crypto_namespaceObject);
;// CONCATENATED MODULE: ./pages/api/picture-update.js



//first create a `bynder instance` since we are using Bynder sdk'a
const bynder = new (bynder_js_sdk_default())({
    baseURL: "https://balr.getbynder.com/api/",
    permanentToken: process.env.BYNDER_PERMANENT_TOKEN
});
//this is the asyncronous function that takes care of posting the pictures to bynder  (it gets called on line 93)
async function pushImagesToShopify(images, productId) {
    for(let i = 0; i < images.length; i++){
        try {
            const response = await fetch(`https://boutique-store-balr.myshopify.com/admin/api/2022-07/products/${productId}/images.json`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": process.env.ACCESS_BOUTIQUE_TOKEN
                },
                body: JSON.stringify({
                    image: {
                        src: images[i]
                    }
                })
            });
            const data = await response.json();
            console.info(`Processed image ${images[i]} for product ${productId}:`, data);
        } catch (err) {
            console.error("Error fetching", err);
        }
    }
}
//this is the `serverless function` that takes care of the communication between shopify's webhook and bynder service
/* harmony default export */ async function picture_update(req, res) {
    // We need to await the Stream to receive the complete body Buffer
    const body = await external_raw_body_default()(req);
    // Get the header from the request
    const hmacHeader = req.headers["x-shopify-hmac-sha256"];
    // Digest the data into a hmac hash
    const digest = external_crypto_default().createHmac("sha256", process.env.WEBHOOK_SECRET_KEY).update(body).digest("base64");
    // Compare the result with the header, we do this to make sure the request is coming from a shopify webhook
    if (digest === hmacHeader) {
        const productData = JSON.parse(body); //find the bynderId tag
        const productId = productData.id;
        const productTags = productData.tags.split(",");
        const bynderTag = productTags.find((tag)=>tag.includes("bynder_id"));
        if (!bynderTag) {
            return res.status(500).json({
                message: "Product does not have a Bynder ID"
            }); //no tag available
        }
        // Checking if the product has images already, in case we run this script on product update
        //this is necessary because on product update, the image uploads would edit the product, retriggering the webhook
        if (productData.images.length) {
            return res.status(500).json({
                message: "Product already has images"
            });
        }
        const bynderId = bynderTag.split(":")[1];
        console.log("bynder id:", bynderId);
        //get only the images which name matches the bynderId followed by an underscore
        bynder.getMediaList({
            keyword: `${bynderId}_`
        }).then(async (data)=>{
            if (data) {
                // sort the images by name, then only grab the ones which thumbnail includes Shopify or the default online thumbnail
                const images = data.sort((a, b)=>a.name > b.name ? 1 : -1).map((img)=>img.thumbnails ? img.thumbnails.Shopify : img.thumbnails.online //whatever thumbnail is used, it needs to be public in Bynder (little world icon next to the preset name)
                ).filter((img)=>img !== null);
                if (!images) {
                    return res.status(200).json({
                        message: `There are no images that are useful for shopify for product ${productId}`
                    });
                }
                await pushImagesToShopify(images, productId);
                console.info(`Product ${productId} updated`);
                return res.status(200).json({
                    message: `Product ${productId} updated`
                });
            } else {
                console.error("Error", {
                    message: `No images in Bynder for ${productId}`
                });
                return res.status(500).json({
                    message: `No images in Bynder for ${productId}`
                });
            }
        }).catch((error)=>{
            console.error("Error in bynder", {
                ...error
            });
            return res.status(500).json({
                ...error
            });
        });
    } else {
        // INVALID - Respond with 401 Unauthorized, the call does not come from shopify and could be an attempt to inject stuff on our store/
        console.info("invalid request");
        return res.status(401).json({
            message: "Unauthorized"
        });
    }
}
// We turn off the default bodyParser provided by Next.js
const config = {
    api: {
        bodyParser: false
    }
};


/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__(440));
module.exports = __webpack_exports__;

})();