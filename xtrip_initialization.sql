-- Create the database

CREATE DATABASE xtrip;

USE xtrip;

-- Create the 'booked_flight' table

CREATE TABLE
    booked_flight (
        id INT AUTO_INCREMENT PRIMARY KEY,
        origin VARCHAR(100),
        dest VARCHAR(100),
        date DATE,
        session_string VARCHAR(255),
        depart_date DATETIME,
        arrive_date DATETIME,
        overnight BOOLEAN,
        stopover_count INT,
        stopover_duration INT,
        fares DECIMAL(10, 2),
        flightnumber VARCHAR(100)
    );

-- Create the 'user' table

CREATE TABLE
    user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        last_name VARCHAR(100),
        first_name VARCHAR(100),
        email VARCHAR(255),
        s3_bucket_folder VARCHAR(255)
    );

-- Create the 'booking' table

CREATE TABLE
    booking (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booked_flight_id INT,
        user_id INT,
        confirmation_number VARCHAR(255),
        FOREIGN KEY (booked_flight_id) REFERENCES booked_flight(id),
        FOREIGN KEY (user_id) REFERENCES user(id)
    );

-- Create the 'flightquery' table

CREATE TABLE
    flightquery (
        id INT AUTO_INCREMENT PRIMARY KEY,
        origin VARCHAR(100),
        dest VARCHAR(100),
        depart_date DATETIME,
        arrive_date DATETIME,
        overnight BOOLEAN,
        stopover_count INT,
        stopover_duration INT,
        fares DECIMAL(10, 2)
    );

-- Create the 'leg' table

CREATE TABLE
    leg (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_string VARCHAR(255)
    );

-- Create the 'flightquery_leg' table

CREATE TABLE
    flightquery_leg (
        id INT AUTO_INCREMENT PRIMARY KEY,
        flightquery_id INT,
        leg_id INT,
        FOREIGN KEY (flightquery_id) REFERENCES flightquery(id),
        FOREIGN KEY (leg_id) REFERENCES leg(id)
    );

-- Create the 'file' table

CREATE TABLE
    file (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        s3_bucket_key VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES user(id)
    );

-- Create the 'bookedflight_session' table

CREATE TABLE
    bookedflight_session (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bookedflight_id INT,
        session_string VARCHAR(255),
        FOREIGN KEY (bookedflight_id) REFERENCES booked_flight(id)
    );

-- Add password_hash to 'user' table

ALTER TABLE user
ADD
    COLUMN password_hash VARCHAR(255) DEFAULT NULL AFTER s3_bucket_folder;
