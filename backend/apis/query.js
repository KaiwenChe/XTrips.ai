
const dbConnection = require('../database.js')

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise');

const router = express.Router();

// Middleware for parsing JSON requests
router.use(bodyParser.json());

const apikey = "657241b7c6eb315e7eeccc30"
// Function to call the FlightAPI asynchronously
const callFlightAPI = async (origin, dest, departDate) => {
  const apiUrl = `https://api.flightapi.io/onewaytrip/${apikey}/${origin}/${dest}/${departDate}/1/0/0/Economy/USD`
  try {
    const response = await request(apiUrl);
    // console.log('FlightAPI Response:', response); //for debugging
    // console.log('------------------------------')
    return JSON.parse(response);
  } catch (error) {
    console.error('Error calling FlightAPI: ' + error);
    return null;
  }
};

// Create a new flight query and store it in the database
exports.query_flight = async (req, res) => {
  const { origin, dest, departDate } = req.body;

  try {
    const flightInfo = await callFlightAPI(origin, dest, departDate);


    if (flightInfo) {
      try {
        await new Promise((resolve, reject) => {
          dbConnection.beginTransaction((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        
        const flightQuerySql = `
          INSERT INTO flightquery (origin, dest, depart_date)
          VALUES (?, ?, ?)
        `;

        const flightQueryValues = [origin, dest, departDate];

    
        const flightQueryResult = await new Promise((resolve, reject) => {
          dbConnection.query(flightQuerySql, flightQueryValues, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
    

        const flightQueryId = flightQueryResult.insertId;

        const newLegs = []; // Create an array to store newly created legs

        // Insert each leg's information into the leg table
        for (const leg of flightInfo.legs) {
          // Create session_string by concatenating airport codes
          const airportCodes = [leg.departureAirportCode, ...leg.stopoverAirportCodes, leg.arrivalAirportCode].join('-');

          const tripId = flightInfo.trips.filter((trip) => trip.legIds[0] === leg.id)[0].id;
          var price = flightInfo.fares.filter((fare) => fare.tripId === tripId).map((fare) => fare.price.totalAmountUsd)[0]
          price = price?price:0

          const legSql = `
            INSERT INTO leg (uid, session_string, depart_date_time, arrival_date_time, overnight, price, stopover_duration, stopovers_count, long_stopover)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const legValues = [leg.id, airportCodes, leg.departureDateTime, leg.arrivalDateTime, leg.overnight, price, leg.stopoverDuration, leg.stopoversCount, leg.longStopover];
          const legInsertResult = await new Promise((resolve, reject) => {
            dbConnection.query(legSql, legValues, (err,result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });

          // Store the newly created leg data without leg.id
          const newLeg = {
            leg_uid: leg.id,
            session_string: airportCodes,
            depart_date_time: leg.departureDateTime,
            arrival_date_time: leg.arrivalDateTime,
            overnight: leg.overnight,
            price:price,
            stopover_duration:leg.stopoverDuration,
            stopovers_count:leg.stopoversCount,
            long_stopover:leg.longStopover
          };

          newLegs.push(newLeg);

          // Insert a record into the flightquery_legs table to establish the relationship
          const flightQueryLegsSql = `
            INSERT INTO flightquery_leg (flightquery_id, leg_id)
            VALUES (?, ?)
          `;

          await new Promise((resolve, reject) => {
            dbConnection.query(flightQueryLegsSql, [flightQueryId, legInsertResult.insertId], (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        }
    
        // Commit the transaction
        await new Promise((resolve, reject) => {
          dbConnection.commit((err) => {
            if (err) {
              // Rollback the transaction if there's an error
              dbConnection.rollback(() => {
                reject(err);
              });
            } else {
              resolve();
            }
          });
        });
    
        res.json(newLegs);
      } catch (error) {
        // Handle any errors that occur during the transaction
        await new Promise((resolve, reject) => {
          dbConnection.rollback(() => {
            console.log(error)
            reject(error);
          });
        });
    
        res.status(500).json({ error: 'An internal server error occurred' });
      }
    } else {
      res.status(500).json({ error: 'Failed to fetch flight information' });
    }
    
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'An internal server error occurred....' });
  }
}

// module.exports = router;
