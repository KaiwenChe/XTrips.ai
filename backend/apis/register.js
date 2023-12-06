const dbConnection = require('../database.js')
const uuidv4 = require('../uuid.js')
exports.register_user = async (req, res) => {

  try {
    var body = req.body;
    console.log('body', body);
    var last_name = body.last_name, first_name = body.first_name, email = body.email, password_hash = body.password_hash;
    const sql = `SELECT COUNT(user.id) AS cnt
    FROM user
    WHERE
        user.last_name = ? AND
        user.first_name = ? AND
        user.email = ?`;
    dbConnection.query(sql,[last_name, first_name, email], (error, results, fields) => {
      if (error) {
        throw error;
      }
      // console.log('results', results[0].cnt);
      if (results[0].cnt != 0) {
        res.status(400).json({
          "message": "User already exists",
        })
      }
      else {
        bucket_folder = uuidv4.uuidv4();
        console.log('b_f', bucket_folder);
        const sql = "INSERT INTO user (last_name, first_name, email, s3_bucket_folder, password_hash) VALUES (?, ?, ?, ?, ?)";
        dbConnection.query(sql, [last_name, first_name, email, bucket_folder, password_hash], (error, results, fields) => {
          if (error) {
            throw error;
          }
          res.status(200).json({
            "message": "Successfully registered user",
            "data": results
          });
        })
          
        };
      console.log("successfully registered")
      }

  )}
  catch (err) {
    res.status(400).json({
      "message": err.message,
      "data": []
    });
  }

}
