
const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const getService = require('./Routes/service');
const createUser = require('./Routes/createUser');
const jwt = require('jsonwebtoken');
const createAdmin = require('./Routes/admin');
require('dotenv').config()

var token = jwt.sign({ foo: 'bar' }, 'shhhhh');

const app = express()
app.use(cors())
app.use(bodyParser.json())

const PORT = process.env.PORT || 5000

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y7jek.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const serviceCollection = client.db("doctors_portal").collection("services")
const appointmentCollection = client.db("doctors_portal").collection("appointment")
const userCollection = client.db("doctors_portal").collection("user")

const adminCollection = client.db("doctors_portal").collection("admin")
const doctorsCollection = client.db("doctors_portal").collection("doctor")

const VerifyJwt = (req, res, next) => {
  const accessToken = req.headers.auth
  if (!accessToken) {
    return res.status(401).send({ message: 'UnAuthoraized' })
  }

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" })
    }
    req.decoded = decoded

    next()
  });
}
async function run() {
  await client.connect()
  console.log('Database Connected')

  getService(serviceCollection, app) //get User Route

  // put user Route 
  // create a user 

  createUser(userCollection, app)
  // createAdmin 
  createAdmin(adminCollection, app)

  app.get('/available', async (req, res) => {
    const date = req.query.date
    // Get All data From Service collection

    const services = await serviceCollection.find().toArray()

    // Get appointments of That Day

    const query = { date: date }

    const appointments = await appointmentCollection.find(query).toArray()

    // For Each Service
    services.forEach((service) => {
      const serviceAppointment = appointments.filter(appoint => appoint.treatment === service.name)

      const appointedSlots = serviceAppointment.map(app => app.slot)

      const available = service.slot.filter(slot1 => !appointedSlots.includes(slot1))

      service.slot = available
    });

    res.send(services)

  })
  // API For Post a Doctor 

  app.post('/doctor' , async (req , res)=>{
    const data = req.body
    const result = await doctorsCollection.insertOne(data)
    res.send(result)
  })

    // API For get all doctor 
    app.get('/doctor' ,async(req , res) =>{
      const result = await doctorsCollection.find().toArray()
      res.send(result)
    })


  app.post('/appointment', async (req, res) => {
    const ApData = req.body
    const query = { date: ApData.date, slot: ApData.slot, email: ApData.email }
    const exists = await appointmentCollection.findOne(query)
    if (exists) {
      return res.send({ success: false, appointment: exists })
    }
    const result = await appointmentCollection.insertOne(ApData)

    res.send({ success: true, result })
  })

  // get Admins 
  // get Admins 
  // get Adm  ins 
  app.get('/admins', async (req, res) => {
    // const email = req.query.email
    // const decodedEmail = req.decoded.email
    const cursor = adminCollection.find()
    const result = await cursor.toArray()
    res.send(result)
    // if (decodedEmail === email) {
    //   const cursor = adminCollection.find()
    //   const result = await cursor.toArray();
    //   return res.send(result)
    // }
    // else {
    //   return res.status(403).send({ message: 'Forbidden Access' })
    // }
  })

  app.get('/appointment', VerifyJwt, async (req, res) => {
    const email = req.query.email
    const decodedEmail = req.decoded.email

    const query = { email: email };
    if (decodedEmail === email) {
      const cursor = appointmentCollection.find(query)
      const result = await cursor.toArray();
      return res.send(result)
    }
    else {
      return res.status(403).send({ message: 'Forbidden Access' })
    }
  })
  // Get All Apointment 
  // Get All Apointment 
  app.get('/all-appointment', VerifyJwt, async (req, res) => {
    const email = req.query.email
    const decodedEmail = req.decoded.email


    if (decodedEmail === email) {
      const cursor = appointmentCollection.find({})
      const result = await cursor.toArray();
      return res.send(result)
    }
    else {
      return res.status(403).send({ message: 'Forbidden Access' })
    }
  })
  app.get('/appointment-one' ,VerifyJwt, async (req , res) => {
    const email = req.query.email
    const query = {email : email}
    const cursor = appointmentCollection.find(query)
    const result = await cursor.toArray()
    res.send(result)
  })

  app.delete('/appointment/:id', async (req, res) => {
    const id = req.params.id
    const result = await appointmentCollection.deleteOne({ "_id": ObjectId(id) });

    res.send({ deleted: true })
  })


  app.get('/user', VerifyJwt, async (req, res) => {
    const user = await userCollection.find().toArray()
    res.send(user)
  })

  app.put('/user/admin/:email', VerifyJwt, async (req, res) => {
    const email = req.params.email;
    const requester = req.decoded.email;
    const requesterAccount = await userCollection.findOne({ email: requester });
    const arg = req.body

    if (requesterAccount.role === 'admin') {
      const filter = { email: email };
      const updateDoc = {
        $set: arg
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    }
    else {
      res.status(403).send({ message: 'forbidden' });
    }

  })
  // getCurrentuser 

  app.get('/currentuser', VerifyJwt, async (req, res) => {
    const email = req.query.email
    // console.log(email)
    const query = { email: email };
    const cursor = userCollection.find(query)
    const result = await cursor.toArray()
    res.send(result)
  })
}
run().catch(console.dir)



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
