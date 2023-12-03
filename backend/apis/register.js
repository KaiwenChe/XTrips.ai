const dbConnection = require('../database.js')

exports.register_user = async (req, res) => {


  try {
    const sql = "select * from user";
    dbConnection.query(sql, (error, results, fields) => {
      if (error) {
        throw error;
      }
      // Send the results as a response
        res.status(200).json({
          "message": "Successfully fetched users",
          "data": results
        });
      });
    console.log("successfully registered")
  }
  catch (err) {
    res.status(400).json({
      "message": err.message,
      "data": []
    });
  }

}
