const { s3, s3_bucket_name, s3_region_name } = require('../aws.js');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const dbConnection = require('../database.js')
const { OpenAI } = require('openai');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Promisify the db query
function queryDatabase(sql, params) {
    return new Promise((resolve, reject) => {
        dbConnection.query(sql, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

exports.generate_recommendation = async (req, res) => {
    try {
        console.log("call to /generate...");

        let body = req.body;
        const booked_flight_id = body.booked_flight_id;
        const user_id = body.user_id;

        let local_results_file = "/tmp/results.txt";
        let bucketkey_results_file = "";

        let sql = "SELECT s3_bucket_folder FROM user WHERE id = ?";
        let queryResult = await queryDatabase(sql, [user_id]);
        if (queryResult.length === 0) {
            res.status(400).json({
                "message": "User does not have a bucket folder",
                "s3_bucket_folder": "null"
            });
            return;
        }

        const s3_bucket_folder = queryResult[0].s3_bucket_folder;

        sql = `
            SELECT origin, dest, date, session_string, depart_date, 
                arrive_date, overnight, stopover_count, stopover_duration
            FROM booked_flight
            WHERE id = ?;
        `;
        queryResult = await queryDatabase(sql, [booked_flight_id]);

        if (queryResult.length === 0) {
            res.status(400).json({
                "message": "No information found for the given booked flight id"
            });
            return;
        }

        let flightDetails = queryResult[0];
        let message = Object.values(flightDetails).join(", ");
        let initial_prompt = `
            Your primary function is to act as an expert travel planner, specifically utilizing users' flight information to generate tailored travel recommendations and tips. When invoked, you will receive a list of flight details for each user, including origin and destination cities, flight date, abbreviations of cities involved in the flight, departure and arrival dates, and details about the flight's nature (overnight or not). Additionally, you will be given the number of stopovers and their durations.
            Based on this information, your task is to provide personalized travel advice. This should include:
            
            1. Efficient itinerary planning considering arrival and departure times.
            2. Suggestions for activities and experiences in the destination and stopover cities, tailored to the user's schedule.
            3. Recommendations for accommodations and dining that align with the user's flight schedule and preferences.
            4. Practical tips about transportation options within and between these cities.
            5. Guidance on navigating overnight flights and making the most of stopovers.
            6. Advice on local customs, cultural etiquette, and essential phrases in the local language for each city.
            7. Information on health and safety guidelines relevant to the destinations and stopover locations.
            
            Your goal is to optimize the user's travel experience by providing comprehensive, actionable, and personalized travel advice based on their specific flight itinerary and preferences.
            Your response should be structured and concise.
        `; 

        // Call to OpenAI's GPT-4 API
        const gpt_response = await openai.chat.completions.create({
            model: "gpt-4-1106-preview",
            messages: [
                { role: "system", content: initial_prompt },
                { role: "user", content: message }
            ]
        });

        if (gpt_response && gpt_response.choices && gpt_response.choices.length > 0) {
            const generatedText = gpt_response.choices[0]['message']['content'].trim();

            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const fileName = `${timestamp}.txt`;
            const bucketkey_results_file = `${s3_bucket_folder}/${fileName}`;

            // Upload the generated text to S3
            const params = {
                Bucket: s3_bucket_name,
                Key: bucketkey_results_file,
                Body: generatedText
            };

            try {
                const uploadCommand = new PutObjectCommand(params);
                const uploadResult = await s3.send(uploadCommand);
                console.log("Upload Success", uploadResult);

                // Insert into the database
                let insertSql = `INSERT INTO file (user_id, s3_bucket_key) VALUES (?, ?)`;
                await queryDatabase(insertSql, [user_id, bucketkey_results_file]);

                console.log("Inserted file record into database");
                res.status(200).json({
                    message: "Recommendation generated and stored successfully",
                });

            } catch (uploadErr) {
                console.error("Error during file upload: ", uploadErr);
                res.status(500).json({ "message": "Error uploading file to S3" });
            }

        } else {
            throw new Error("Failed to generate response from GPT-4");
        }
        
    } catch (err) {
        console.log("**ERROR:", err.message);

        res.status(400).json({
            "message": err.message
        });
    }
}