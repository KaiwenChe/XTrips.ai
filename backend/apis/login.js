const dbConnection = require('../database.js')
const jwt = require('jsonwebtoken')

exports.login_user = async (req, res) => {
    try {
        var body = req.body;
        console.log('body', body);
        var email = body.email, password_hash = body.password_hash;
        sql = `SELECT id, last_name, first_name FROM user WHERE email = ? AND password_hash = ?`;
        dbConnection.query(sql, [email, password_hash], (error, results) => {

            if (error) {
                throw error;
            }

            if (results.length === 0) {
                res.status(400).json({
                    "message": "User does not exist or wrong password",
                    "userid": -1,
                    "last_name": "null",
                    "first_name": "null"
                });
                return;
            }

            else {
                var id = results[0].id, last_name = results[0].last_name, first_name = results[0].first_name;

                const token = 'Bearer ' + jwt.sign(
                    {
                        user_id: id,
                        last_name: last_name,
                        first_name: first_name,
                        email: email
                    },
                    'f90f8eef-59bc-4bfa-a1e0-ca9bba0ff4d2',
                    {
                      expiresIn: 3600 * 24 * 3
                    }
                )

                res.status(200).json({
                    "message": "successfully logged in", 
                    data: { token: token, user_id: id }
                })
            }
        })
        
    }

    catch (err) {
        res.status(400).json({
          "message": err.message,
          "data": []
        });
      }
}