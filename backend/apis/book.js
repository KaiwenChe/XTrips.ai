const dbConnection = require('../database.js')

function generateConfirmationCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let cm = '';

    for (let i = 0; i < length; i++) {
        const ri = Math.floor(Math.random() * characters.length);
        cm += characters.charAt(ri);
    }

    return cm;
}

exports.book_flight = async (req, res) => {
    try {
        console.log(1);
        const {userid, flightnumber, origin, dest, date, session_string, depart_date, arrive_date, overnight, stopover_count, stopover_duration, fares} = req.body;
        const sql1 = "insert into booked_flight (flightnumber, origin, dest, date, session_string, depart_date, arrive_date, overnight, stopover_count, stopover_duration, fares) values (?,?,?,?,?,?,?,?,?,?,?)"
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
        exe(sql1, [flightnumber, origin, dest, date, session_string, depart_date, arrive_date, overnight, stopover_count, stopover_duration, fares]).then(() =>{
            return exe('select last_insert_id() as lastid', []);}).then((data) => {
            const lid = data[0].lastid;
            const cm = generateConfirmationCode(6);
            const sql2 = "insert into booking (booked_flight_id, user_id, confirmation_number) values (?, ?, ?)";
            exe(sql2, [lid, userid, cm]).then(() =>{
                res.status(200).json({
                    'message': 'You have booked the flight successfully!!!'
                })
            })
        })


    }
    catch (err){
        res.status(400).json({
            'message': err.message,
            'data': []
        })
    }
}