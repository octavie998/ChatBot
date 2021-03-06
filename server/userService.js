const jsonDB = require('node-json-db');
const db = new jsonDB("MyDatabase", true, false);

function isUserKnown(senderId) {
    try {
        db.getData('/users/' + senderId);
        return true;
    } catch(error) {
        return false;
    }
}

function addUser(senderId, userData) {
    db.push('/users/' + senderId, userData)
}

function getData() {
    return db.getData('/');
}

function getUser(senderId) {
    return db.getData('/users/' + senderId);
}

function changeUserStatus(senderId, status) {
    db.push('/users/' + senderId + '/status', status);
}

function incrementUser(senderId) {
    try {
        var user = db.getData('/users/' + senderId);
        var nb = user.nbMessagesSend;

        db.push('/users/' + senderId + '/nbMessagesSend', nb + 1);
    } catch (error) {
        console.log('Error');
    }
}

module.exports = {
    isUserKnown: isUserKnown,
    addUser: addUser,
    changeUserStatus: changeUserStatus,
    getUser: getUser,
    getData: getData,
    incrementUser: incrementUser
};
