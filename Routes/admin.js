

const createAdmin = (collection, app) => {
    // create a Admin 
    app.put('/admin/:email' ,async (req, res) => {
        const email = req.params.email ;

        const filter = {email: email};
        const options = {upsert:true};
        const updateDoc = {
            $set:{email : email}
        };
        const result = await collection.updateOne(filter , updateDoc , options) ;

        res.send(result)
    })
   
}

module.exports = createAdmin