
const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()


const app = express()
app.use(cors())
app.use(bodyParser.json())

const PORT = process.env.PORT || 5000

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y7jek.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    await client.connect()
    console.log('Database Connected')
    const serviceCollection = client.db("doctors_portal").collection("services")

    app.get('/services' , async (req , res)=>{
        const query = {};
        const cursor = serviceCollection.find(query)
        const services = await cursor.toArray();
        res.send(services)
    })
    
    // 2118684145 2021 
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Hello World!')
  })
  
  app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
  })