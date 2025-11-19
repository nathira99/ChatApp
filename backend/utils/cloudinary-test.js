require("dotenv").config({ path: "../.env" });
const express = require("express");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET
});

cloudinary.api.ping().
then(console.log).catch(console.error);