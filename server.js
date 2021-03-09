const express = require('express');
const app = express();
const port = 4000;
const TIMESCALE_SERVER='postgresql://tianjun:wood-mit7@timescale.dev2db.com:5432/tsitp';
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    // connectionString: process._env.TIMESCALE_SERVER
    connectionString: TIMESCALE_SERVER
});

app.use(express.static('public'));

app.listen(port, () => console.log(`Sensor data app listening on port ${port}`));

app.get('/device', async (req, res) => {
    const query = `SELECT distinct device 
        FROM sensor_data 
        WHERE measurement = 'temperature'
        ORDER BY device`; 
    console.log(query);

    try {
        const results = await pool.query(query);
        console.log(`returning ${results.rowCount} rows`);
        const devices = results.rows.map(d => d.device);
        res.send(devices);
    } catch(err) {
        console.log(err.stack);
        res.status(400).send('server error');
    }
});

app.get('/device/:device/temperature', async (req, res) => {
    const device = req.params.device;
    const query = `SELECT recorded_at, reading::float as temperature 
        FROM sensor_data 
        WHERE measurement = 'temperature' 
        AND device = $1`;
    const params = [device];
    console.log(query, params);

    try {
        const results = await pool.query(query, params);
        console.log(`returning ${results.rowCount} rows`);
        res.send(results.rows);
    } catch(err) {
        console.log(err.stack);
        res.status(400).send('server error');
    }
});