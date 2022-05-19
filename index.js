let scindex = require('./scindex');
let express = require('express');
const app = express()
const port = 3000

let deviceConnected = false;
let scannedTags = [];

app.use(express.json());


app.post('/connectDevice', (req, res) => {
    console.log("connectDevice");
    let deviceId = req.body.deviceId;
    scindex.connectDevice(deviceId, (response) => {
        res.send(response);
        deviceConnected = true;
        scindex.deviceConnectListener(deviceId, (response) => {
            console.log(response);
        });

        scindex.scanStarted(deviceId, (response) => {
            console.log(response);
        });

        scindex.scanCompleted(deviceId, (response) => {
            console.log(response);
        });

        scindex.addTagListener(deviceId, (response) => {
            console.log(response);
            scannedTags.push(response);
        });

        scindex.ledTurnedOnListener(deviceId, (response) => {
            console.log(response);
        });

        scindex.ledTurnedOffListener(deviceId, (response) => {
            console.log(response);
        });
    });
})

app.post('/startScan', (req, res) => {
    console.log("startScan");
    let deviceId = req.query.deviceId;
    if (deviceConnected) {
        scindex.startScan(deviceId, "none", (response) => {
            res.send(response);
        });
    } else {
        res.send("Device not connected");
    }
})

app.post('/stopScan', (req, res) => {
    console.log("stopScan");
    let deviceId = req.query.deviceId;
    if (deviceConnected) {
        scindex.stopScan(deviceId, (response) => {
            response.tags = scannedTags;
            res.send(response);
            scannedTags = [];
        });
    } else {
        res.send("Device not connected");
    }
})

app.post('/ledOn', (req, res) => {
    console.log("ledOn");
    if (deviceConnected) {
        scindex.ledOn(req.body.tags, (response) => {
            res.send(response);
        });
    } else {
        res.send("Device not connected");
    }
})

app.get('/ledOff', (req, res) => {
    console.log("ledOff");
    if (deviceConnected) {
        scindex.ledOff((response) => {
            res.send(response);
        });
    } else {
        res.send("Device not connected");
    }
})

app.get('/disconnectDevice', (req, res) => {
    console.log("disconnectDevice");
    let deviceId = req.query.deviceId;
    if (deviceConnected) {
        scindex.disconnectDevice(deviceId, (response) => {
            res.send(response);
            deviceConnected = false;
        });
    } else {
        res.send("Device not connected");
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})