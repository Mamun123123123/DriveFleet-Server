const express = require('express')
const dotenv = require("dotenv")
dotenv.config()
const app = express()
const cors = require('cors')
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs')

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

const verifyToken = async(req,res,next)=>{
       const header = req.headers.authorization
       if(!header){
        return res.status(401).json({message:"Unauthorized"})
       }
       const token = header.split(" ")[1]
       if(!token){
        return res.status(401).json({message:"Unauthorized"})
       }
       console.log(token);

       try{
        const {payload} = await jwtVerify(token,JWKS)
       console.log(payload);
       next()  
       }catch(error){
          return res.status(403).json({message:"Forbidden"})
       }
       
        
    }

async function run() {
  try {

    // await client.connect();

    const db = client.db("drivefleet")
    const carCollection = db.collection("cars")
    const bookingCollection = db.collection("bookings")

    app.get("/explore-cars", async (req, res) => {
  try {
    const { search, type } = req.query;

    let query = {};

   
    if (search) {
      query.carName = {
        $regex: search,
        $options: "i",
      };
    }

  
    if (type) {
      query.carType = type;
    }

    // console.log("QUERY:", query);

    const result = await carCollection.find(query).toArray();

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

    app.post("/car", async (req, res) => {
  const carData = req.body;

  const newCar = {
    ...carData,
    booking_count: 0, 
  };

  const result = await carCollection.insertOne(newCar);
  res.json(result);
});

    app.get('/cars/:id', verifyToken ,async (req, res) => {
      const { id } = req.params
      const result = await carCollection.findOne({ _id: new ObjectId(id) })
      res.json(result)
    })

    app.post("/booking", async (req, res) => {
  const bookingData = req.body;

  await bookingCollection.insertOne(bookingData);

  await carCollection.updateOne(
    { _id: new ObjectId(bookingData.carId) },
    { $inc: { booking_count: 1 } }
  );

  res.json({ success: true });
});

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

    // await client.db("admin").command({ ping: 1 });
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