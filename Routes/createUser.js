const jwt = require('jsonwebtoken')
require('dotenv').config()

function createUser(collection , app ) {
    app.put('/user/:email' ,async (req, res) => {
        const email = req.params.email ;
        const user = req.body;
        const filter = {email: email};
        const options = {upsert:true};
        const updateDoc = {
            $set:user
        };
        const result = await collection.updateOne(filter , updateDoc , options) ;
        const token = jwt.sign({email : email} , process.env.ACCESS_TOKEN)
        res.send({accessToken : token , result});
    })
    
   
}

module.exports = createUser