import Bynder from "@bynder/bynder-js-sdk";
import getRawBody from "raw-body";
import crypto from "crypto";
console.log("file running")

//first create a `bynder instance` since we are using Bynder sdk'
const bynder = new Bynder({
  baseURL: "https://balr.getbynder.com/api/",
  permanentToken: process.env.BYNDER_PERMANENT_TOKEN,
});



export default function handler(req, res) {
  res.status(200).json({ bynder})
}