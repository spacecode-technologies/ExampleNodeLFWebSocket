let scindex = require('./scindex');
let express = require('express');
const app = express()
const port = 3030

app.use(express.json());


app.post('/connectDevice', (req, res) => {
    console.log("connectDevice");
    let deviceId = req.body.deviceId;
    scindex.connectDevice(deviceId, (response) => {
        res.send(response);
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
    let deviceId = req.body.deviceId;
    scindex.startScan(deviceId, "none", (response) => {
        res.send(response);
    });
})

app.post('/stopScan', (req, res) => {
    console.log("stopScan");
    let deviceId = req.body.deviceId;
    scindex.stopScan(deviceId, (response) => {
        res.send(response);
    });
})

app.post('/ledOn', (req, res) => {
    console.log("ledOn");
    scindex.ledOn(req.body.deviceId, req.body.tags, (response) => {
        res.send(response);
    });
})

app.post('/ledOff', (req, res) => {
    console.log("ledOff");
    scindex.ledOff(req.body.deviceId, (response) => {
        res.send(response);
    });
})

app.post('/disconnectDevice', (req, res) => {
    console.log("disconnectDevice");
    let deviceId = req.body.deviceId;
    scindex.disconnectDevice(deviceId, (response) => {
        res.send(response);
    });
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})