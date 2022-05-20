const { io } = require('socket.io-client');
const {disconnectDevice} = require("./index");
const {connection} = require("./scindex");

// let inScan = false;
let deviceConnected = false;
let selectedSocketId = null;
let connectDeviceSerialNumber = null;
let deviceMode = null;

let sockets = [];

exports.socketDisconnect = async function(deviceId, callback) {
    if (sockets.length > 0) {
        sockets.map(item => {
            if (item.deviceId === deviceId)
                item.socket.disconnect();
        });
    } else {
        console.log("Device not connected");
    }
}


// callback to listen for device connection
exports.deviceConnectListener = async function(deviceId, callback) {
    if (sockets.length > 0) {
        sockets.map(item => {
            if (item.deviceId === deviceId)
                item.socket.on("device_connected", (response) => {
                    console.log("module: ", response)
                    if (response === "Device Disconnected") {
                        sockets.splice(sockets.indexOf(item), 1);
                    }
                    callback(response)
                })
        })
    } else {
        callback("Device not connected");
    }
}

//callback to get the tag read by the reader
exports.addTagListener = async function(deviceId, callback) {
    if (sockets.length > 0) {
        sockets.map(item => {
            if (item.deviceId === deviceId)
                item.socket.on("receive_addTag", (response) => {
                    console.log("module:", response)
                    item.scannedTags.push(response);
                    callback(response);
                })
        })
    } else {
        console.log("Device not connected");
    }
}

// callback to listen when the scan is getting started
exports.scanStarted = async function(deviceId, callback) {
    if (sockets.length > 0) {
        sockets.map(item => {
            if (item.deviceId === deviceId)
                item.socket.on("receive_scanStarted", (response) => {
                    console.log("module:", response)
                    callback(response);
                })
        })
    } else {
        console.log("Device not connected");
    }
}

// callback when the scan completed
exports.scanCompleted = async function(deviceId, callback) {
    if (sockets.length > 0) {
        sockets.map(item => {
            if (item.deviceId === deviceId)
                item.socket.on("receive_scanCompleted", (response) => {
                    console.log("module:", response)
                    if (response.status) {
                        // inScan = false
                    }
                    callback(response)
                })
        })
    } else {
        console.log("Device not connected");
    }
}


// callback when led turned on
exports.ledTurnedOnListener = async function(deviceId, callback) {
    if (sockets.length > 0) {
        sockets.map(item => {
            if (item.deviceId === deviceId)
                item.socket.on("event_lighting_started", (response) => {
                    console.log("module: ", response);
                    callback(response)
                })
        })
    } else {
        console.log("Device not connected");
    }
}

// callback when led turned off
exports.ledTurnedOffListener = async function(deviceId, callback) {
    if (sockets.length > 0) {
        sockets.map(item => {
            if (item.deviceId === deviceId)
                item.socket.on("event_lighting_stopped", (response) => {
                    console.log("module: ", response)
                    callback(response)
                })
        })
    } else {
        console.log("Device not connected");
    }
}

// call this to get register with spacecode devices
exports.connection = async function(deviceId, callback) {
    if (sockets.length > 0) {
        sockets.map(item => {
            if (item.deviceId === deviceId)
                item.socket.emit("connection", {"deviceType": "client"}, (response) => {
                    console.log("module:", response);
                    let sockets = response.sockets;
                    let connectionSuccess = false;
                    sockets.forEach((socketItem) => {
                        if (!connectionSuccess) {
                            socket.emit("generic", {
                                "eventName": "getDevices",
                                "socketId": socketItem.socketId
                            }, (response1) => {
                                selectedSocketId = socketItem.socketId
                                connectionSuccess = true;
                                console.log(response1)
                                callback(response1)
                            })
                        }
                    })
                })
        })
    } else {
        console.log("Device not connected");
    }
}

// call this to connect the device where deviceId can be the serial number of the device or the ipAddress
exports.connectDevice = async function(deviceId, callback) {
    console.log("Total clients connected: ", sockets.length)
    let deviceIdExists = false;
    let foundItem = null;
    let disconnectSuccess = false;
    sockets.map(item => {
        if (item.deviceId === deviceId) {
            deviceIdExists = true;
            foundItem = item;
        }
    })
    if (deviceIdExists) {
        sockets.splice(sockets.indexOf(foundItem), 1);
        foundItem.socket.emit("generic", {
            "eventName": "disconnectDevice",
            "socketId": foundItem.selectedSocketId,
            "deviceId": foundItem.connectDeviceSerialNumber
        }, (response) => {
            console.log("module:", response)
            if (response.status) {
                disconnectSuccess = true;
            }
        })
    }

    sockets.push({
        deviceId: deviceId,
        socket: io("http://localhost:5454/", {
            reconnectionDelayMax: 10000,
            auth: {
                token: "v3"
            }
        }),
        deviceConnected: false,
        connectDeviceSerialNumber: null,
        deviceMode: deviceId.includes(":") ? "ethMode" : "usbMode",
        selectedSocketId: null,
        scannedTags: []
    })
    if (sockets.length > 0) {
        sockets.map(item => {
            if (item.deviceId === deviceId) {
                if (!item.deviceConnected) {
                    item.socket.emit("connection", {"deviceType": "client"}, (response1) => {
                        console.log("module:", response1)
                        // item.selectedSocketId = response1.sockets[0].socketId
                        item.socket.emit("send_connectDevice", {
                            "socketId": "",
                            deviceId
                        }, (response) => {
                            console.log("module:", response);
                            if (response.status) {
                                item.deviceConnected = true;
                                item.connectDeviceSerialNumber = response.serialNumber;
                            }
                            console.log(item)
                            callback({
                                "status": response.status,
                                "message": response.message
                            })
                        })
                    })
                } else {
                    callback({
                        "status": true,
                        "message": "Device already connected"
                    })
                }
            }
        })
    } else {
        callback({
            "status": false,
            "message": "No device connected"
        })
    }
}

// call this to disconnect the device
exports.disconnectDevice = async function(deviceId, callback) {
    if (sockets.length > 0) {
        sockets.map(item => {
            if (item.deviceId === deviceId) {
                if (item.deviceConnected) {
                    item.socket.emit("generic", {
                        "eventName": "disconnectDevice",
                        "socketId": item.selectedSocketId,
                        "deviceId": item.connectDeviceSerialNumber
                    }, (response) => {
                        console.log("module:", response)
                        if (response.status) {
                            sockets.splice(sockets.indexOf(item), 1);
                        }
                        callback(response);
                    })
                } else {
                    callback({
                        "status": false,
                        "message": "Device not connected"
                    })
                }
            }
        })
    } else {
        callback({
            "status": false,
            "message": "No device connected"
        })
    }
}

// function to start scan
let iteration = 0
exports.startScan = async function(deviceId, mode, callback) {
    console.log("deviceId: ", deviceId);
    if (sockets.length > 0) {
        sockets.map(item => {
            if (item.deviceId === deviceId) {
                if (item.deviceConnected) {
                    item.socket.emit("generic", {
                        "eventName": "startScan",
                        "socketId": item.selectedSocketId,
                        "deviceId": item.connectDeviceSerialNumber,
                        "scanMode": mode
                    }, (response) => {
                        iteration++
                        console.log(iteration)
                        console.log("module 1 :", response)
                        callback(response)
                    })
                } else {
                    callback({
                        "status": false,
                        "message": "Device not connected"
                    })
                }
            }
        })
    } else {
        callback({
            "status": false,
            "message": "No device connected"
        })
    }
}

// function to stop scan
exports.stopScan = async function(deviceId, callback) {
    if (sockets.length > 0) {
        sockets.map(item => {
            if (item.deviceId === deviceId) {
                if (item.deviceConnected) {
                    item.socket.emit("generic", {
                        "eventName": "stopScan",
                        "socketId": item.selectedSocketId,
                        "deviceId": item.connectDeviceSerialNumber
                    }, (response) => {
                        console.log("module:", response)
                        response.scannedTags = item.scannedTags
                        callback(response)
                        item.scannedTags = []
                    })
                } else {
                    callback({
                        "status": false,
                        "message": "Device not connected"
                    })
                }
            }
        })
    } else {
        callback({
            "status": false,
            "message": "No device connected"
        })
    }
}

// function to turn the led on
exports.ledOn = async function(deviceId, tags, callback) {
    console.log("selectedSocketId", selectedSocketId)
    console.log("deviceId", connectDeviceSerialNumber)
    console.log("deviceMode", deviceMode)
    console.log("tags", tags)
    if (sockets.length > 0) {
        sockets.map(item => {
            if (item.deviceId === deviceId) {
                if (item.deviceConnected) {
                    item.socket.emit("generic", {
                        "eventName": "ledOn",
                        "socketId": selectedSocketId,
                        "deviceId": connectDeviceSerialNumber,
                        "list": tags,
                        "mode": deviceMode
                    }, (response) => {
                        console.log("module:", response)
                        callback(response)
                    })
                } else {
                    callback({
                        "status": false,
                        "message": "Device not connected"
                    })
                }
            }
        })
    } else {
        callback({
            "status": false,
            "message": "No device connected"
        })
    }
}

// function to turn the led off
exports.ledOff = async function(deviceId, callback) {
    if (sockets.length > 0) {
        sockets.map(item => {
            if (item.deviceId === deviceId) {
                if (item.deviceConnected) {
                    item.socket.emit("generic", {
                        "eventName": "ledOff",
                        "socketId": selectedSocketId,
                        "deviceId": connectDeviceSerialNumber
                    }, (response) => {
                        callback(response);
                    })
                } else {
                    callback({
                        "status": false,
                        "message": "Device not connected"
                    })
                }
            }
        })
    } else {
        callback({
            "status": false,
            "message": "No device connected"
        })
    }
}

// function to refresh the tag while having continues mode scanning
// exports.refreshTags = async function(callback) {
//     socket.emit("generic", {
//         "eventName": "refreshTags",
//         "socketId": selectedSocketId,
//         "deviceId": item.connectDeviceSerialNumber,
//     }, (response) => {
//         console.log("module:",response)
//         callback(response)
//     })
// }


