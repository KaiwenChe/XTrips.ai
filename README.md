# XTrips.ai Final Project Report

## 1. Team Member:
Jingyu WU  jwt9656
Kaiwen Che mzi4117
Bingqi Shang eoq2203
Yangshuo Zhang

## 2. Database Design and Deployment
The 'xtrip' database, designed for a flight booking system, has been successfully created and deployed on Amazon Web Services (AWS). This deployment leverages AWS's robust, scalable, and secure cloud infrastructure to ensure high availability and performance of the flight booking system.

The database consists of eight interrelated tables:

1.	booked_flight: Stores details of each booked flight’s information.
2.	user: Stores user information. A password is implemented for security,
3.	booking: Links user information with responding flight bookings.
4.	flightquery: Stores flight’s origin, destination, and date
5.	leg: Stores each flight’s information returned by flightAPI
6.	flightquery_leg: connects flightquery and leg
7.	file: stores itinerary files’ amazon s3 keys
8.	bookedflight_session: Links booked_flight with a session string.

Here is the sql file of the database: [xtrip_initialization.sql](xtrip_initialization.sql)

## 3. Backend and API Design
Our backend infrastructure utilizes the express.js framework and is deployed on Amazon Web Services (AWS) Elastic Compute Cloud (EC2) for robust and scalable performance.

Our project have two basic workflows, here's a breakdown of each:
**Search & Booking Flow:**
1. Gather Information: Collect data from user input.
2. API Call: Call the query api to get flight information.
3. Database Storage: Store the processed data in flightquery, legs, and flightquery_legs tables.
4. Display Flight Options: Show flight options to the user.
5. User Selection: User chooses a flight.
6. Book Flight: Selected flight details are stored in booked_flight.
7. Generate Confirmation Number: Create a unique identifier (UUID) for the booking.
8. Record Booking: Add a new record to the booking table.
9. Retrieve & Return Data: Fetch new records and return the confirmation number.

**Generate Recommendation Flow:**

1. Fetch User's Booked Flights: Use confirmation code to get booked_flight.ids.
2. Show Booked Flights: Display these flights to the user.
3. User Specifies Flight: User chooses a flight by booked_flight.id.
4. Recommendation Generation: Execute generate() which includes calling the GPT API, uploading to S3, and saving data to the files table.

Here is a list of our apis:
1. **/register**: Register the user to our system
2. **/login**: Login the user and get a token for authentication
3. **/query**: Search the flight information
4. **/book**: Book the flight and get a confirmation number
5. **/display**: Display the bookings of a user
6. **/generate**: Generate the travel itinerary recommendations by ChatGPT
7. **/view_rec**: View travel itinerary recommendations


## 4. Client Design
The client-side application allows users to interact with the system to book flights and generate itinerary. Here is a guide about how to use this application:
1. Login/Register

Before proceeding to the system’s main features, the user needs to login with an email address and a password. For new users, they can register a new account instead and use it to login next time.

2. Search Flight and Make a Reservation

The user can search flights by inputting airport codes and date. After a while, the user will see a list of flights and choose one to book. To complete the reservation, payment information is required. The user will receive a notification when the process is finished.

3. Display Reservations

The user is able to see details about all reservations made by the user. 

4. Generate and View Itinerary Recommendation

To generate the recommendation, the user is required to provide the confirmation number of a reservation made on the system. A file id will be returned and the user can use it to retrieve a file with itinerary recommendation inside.

## 5. Run the Project
### 5.1 Project File Structure

```bash
.
├── .gitignore
├── LICENSE
├── README.md
├── backend
│   ├── .env
│   ├── apis
│   │   ├── book.js
│   │   ├── display.js
│   │   ├── generate.js
│   │   ├── login.js
│   │   ├── query.js
│   │   ├── register.js
│   │   └── view_rec.js
│   ├── app.js
│   ├── aws.js
│   ├── config.js
│   ├── database.js
│   ├── package-lock.json
│   ├── package.json
│   ├── uuid.js
│   └── xtrip-config.ini
├── frontend
│   ├── client-config.ini
│   ├── main.py
│   └── sessions.json
└── xtrip_initialization.sql

```
### 5.2 Run Backend

```shell
cd backend/
npm install
node app.js
```

### 5.3 Run Frontend
Make sure to update the `client-config.ini` to connect the correct backend service.
```shell
cd frontend/
python3 main.py
```




