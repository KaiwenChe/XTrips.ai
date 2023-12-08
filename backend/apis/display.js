const dbConnection = require('../database.js')

exports.display_booking = async (req, res) =>{
    try {
        const exe = (sql, args) => {
            return new Promise((resolve, reject) => {
                dbConnection.query(sql, args, (err, results) => {
                    if (err) {
                        const mes = {
                            "message": "some sort of error message"
                        }
                        res.status(400);
                        reject(mes);
                        return;
                    }
                    resolve(results);
                });
            });
        };
        const userid = req.body.userid
        const sql1 = 'select * from booked_flight join booking on booked_flight.id = booking.booked_flight_id where user_id = ?';
        exe(sql1, [userid]).then((data) => {
            console.log(data)
            res.status(200).json({
                'data': data
            });
        })
    }
    catch (err){
        res.status(400).json({
            'message': err.message,
            'data': []
        })
    }
}
