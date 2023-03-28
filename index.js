const express = require("express");
const { Client } = require("pg");
const bodyParser = require("body-parser");
const { downloadImage, addOverlayToImage } = require("./utils");
const path = require("path");
const Jimp = require("jimp");



const app = express();
const port = 3000;

const dbConfig = {
  user: "postgres",
  host: "localhost",
  database: "zesty",
  password: "engineTest888",
  port: "5555",
};

// Create a PostgreSQL client to connect to the database
const client = new Client({});

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// API endpoint to search properties within a given distance of a GeoJSON point
app.post("/find", async (req, res) => {
  try {
    // Initialize a PostgreSQL client
    const client = new Client(dbConfig);

    // Connect to the database
    await client.connect();

    // Get the location and distance from the request body
    const { location, distance: searchDistance } = req.body;

    // Query the database for all properties within the given search radius
    const query = `SELECT id, geocode_geo FROM properties WHERE ST_DWithin(geocode_geo, ST_GeomFromGeoJSON($1), $2)`;
    const values = [JSON.stringify(location), searchDistance];
    const result = await client.query(query, values);

    // Close the database connection
    await client.end();

    // Create an array of property IDs from the query results
    const propertyIds = result.rows.map((row) => row.id);

    // Send the array of property IDs in the response
    res.send(propertyIds);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/display/:id/overlays", async (req, res) => {
  const { id } = req.params;
  const {
    geocode_color = "blue",
    parcel_color = "yellow",
    building_color = "red",
  } = req.query;

  // Initialize a PostgreSQL client
  const client = new Client(dbConfig);

  // Connect to the database
  await client.connect();

  try {
    // Get property data from DB
    const result = await client.query("SELECT * FROM properties WHERE id=$1", [
      id,
    ]);
    const property = result.rows[0];

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Download image from cloud storage
    const imageUrl = property.image_url;
    const imagePath = path.join(__dirname, `images/${id}.tif`);
    await downloadImage(imageUrl, imagePath);

    const imageBuffer = await addOverlayToImage(imagePath, property, parcel_color, building_color, geocode_color);

    // Serve image
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    res.end(imageBuffer, 'binary');
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
