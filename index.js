const express = require('express')
const dotenv = require("dotenv")
dotenv.config()
const app = express()
const cors = require('cors')
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    await client.connect();

    const db = client.db("drivefleet")
    const carCollection = db.collection("cars")
    const bookingCollection = db.collection("bookings")

    app.get('/explore-cars', async (req, res) => {
      const result = await carCollection.find().toArray()
      res.json(result)
    })

    app.post('/car', async (req, res) => {
      const carData = req.body
      const result = await carCollection.insertOne(carData)
      res.json(result)
    })

    app.get('/cars/:id', async (req, res) => {
      const { id } = req.params
      const result = await carCollection.findOne({ _id: new ObjectId(id) })
      res.json(result)
    })

    app.post('/booking', async (req, res) => {
      const bookingData = req.body
      const result = await bookingCollection.insertOne(bookingData)
      res.json(result)
    })

    app.get("/bookings/:userId", async (req, res) => {
      const { userId } = req.params
      const result = await bookingCollection.find({ userId }).toArray()
      res.json(result)
    })

    app.get('/my-added-cars/:email', async (req, res) => {

      try {

        const { email } = req.params;

        const result = await carCollection.find({ userEmail: email }).toArray();

        res.json(result);

      } catch (error) {

        res.status(500).json({
          success: false,
          message: error.message
        });

      }

    });

    app.get('/car/:id', async (req, res) => {
      try {
        const { id } = req.params;

        const result = await carCollection.findOne({
          _id: new ObjectId(id)
        });

        res.json(result);

      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    app.delete('/car/:id', async (req, res) => {
      try {

        const { id } = req.params;

        const result = await carCollection.deleteOne({
          _id: new ObjectId(id)
        });

        res.json(result);

      } catch (error) {

        res.status(500).json({
          success: false,
          message: error.message
        });

      }
    });

   
    app.put('/car/:id', async (req, res) => {

      try {

        const { id } = req.params;
        const updatedCar = req.body;

        const result = await carCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              carName: updatedCar.carName,
              dailyRentPrice: updatedCar.dailyRentPrice,
              carType: updatedCar.carType,
              imageUrl: updatedCar.imageUrl,
              seatCapacity: updatedCar.seatCapacity,
              pickupLocation: updatedCar.pickupLocation,
              description: updatedCar.description,
              availabilityStatus: updatedCar.availabilityStatus
            }
          }
        );

        res.json(result);

      } catch (error) {

        res.status(500).json({
          success: false,
          message: error.message
        });

      }

    });

    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB");

  } finally {
    
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send("Server is running...")
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})