const { s3, s3_bucket_name, s3_region_name, lambda, InvokeCommand } = require('./aws.js');

exports.generate_recommendation = async (req, res) => {
    try {
        console.log("call to /generate...");

        let body = req.body;

        let params = {
            "booked_flight_id": body.booked_flight_id,
            "user_id": body.user_id
        };

        input = {
            FunctionName: "generate_recommendation",
            InvocationType: "RequestResponse",
            LogType: "Tail",
            Payload: JSON.stringify(params)
        };

        console.log("Invoking lambda...");

        command = new InvokeCommand(input);
        let { Payload, LogResult } = await lambda.send(command);

        let logs = Buffer.from(LogResult, "base64").toString();
        console.log(logs);

        let payload = Buffer.from(Payload, "base64");
        payload = JSON.parse(payload);

        if (payload.statusCode != 200)
            throw new Error(payload.body);

        console.log("sending response");

        res.json({
            "message": "recommendation successfully generated and stored",
            "data": {}
        });
    } catch (err) {
        
    }
}