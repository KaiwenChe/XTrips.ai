const { s3, s3_bucket_name, s3_region_name } = require('../aws.js');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const dbConnection = require('../database.js')

exports.view_recommendation = async (req, res) => {
    console.log("call to /view_recommendation...");

    try {
        const file_id = req.params.file_id;

        const sql = `SELECT s3_bucket_key FROM file WHERE id = ?`;
        dbConnection.query(sql, [file_id], async (err, results) => {
            if (err || results.length === 0) {
                return res.status(400).json({
                    "message": "no such file...",
                    "data": []
                });
            }

            const s3_bucket_key = results[0].s3_bucket_key;

            const getObjectParams = {
                Bucket: s3_bucket_name,
                Key: s3_bucket_key
            };

            const command = new GetObjectCommand(getObjectParams);
            const s3result = await s3.send(command);
            const datastr = await s3result.Body.transformToString("base64");

            return res.status(200).json({
                "message": "success",
                "data": datastr
            });
        });

    } catch (error) {
        console.log("**ERROR:", error.message);

        res.status(400).json({
            "message": err.message,
            "data": []
        });
    }
}