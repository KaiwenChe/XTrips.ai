const dbConnection = require('../database.js')

exports.login_user = async (req, res) => {
    try {
        var body = req.body;
        var email = body.email, password_hash = body.password_hash;
    }

    catch (err) {
        res.status(400).json({
          "message": err.message,
          "data": []
        });
      }
}