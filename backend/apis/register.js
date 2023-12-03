const dbConnection = require('./database.js')

exports.register_user = async (req, res) => {

  console.log("call to /users...");

  try {

    const query = 'SELECT * FROM users';
    dbConnection.query(query, (error, results, fields) => {
    if (error) {
      throw error;
    }

    // Send the results as a response
      res.status(200).json({
        "message": "Successfully fetched users",
        "data": results
      });
    });
    
    

  }//try
  catch (err) {
    res.status(400).json({
      "message": err.message,
      "data": []
    });
  }//catch

}//get
