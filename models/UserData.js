// models/UserData.js

const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
    학년: String,
    과목: String,
    질문: String,
    보기1: String,
    보기2: String,
    보기3: String,
    보기4: String,
    정답: String,
    이미지: String,
    '지문 ID': String,
    지문: String
}, { _id: false });

const recordSchema = new mongoose.Schema({
    date: String,
    grade: String,
    subject: String,
    score: String
}, { _id: false });

const goalSchema = new mongoose.Schema({
    subject: String,
    count: Number
}, { _id: false });

const userDataSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    incorrect: [problemSchema],
    records: [recordSchema],
    goal: goalSchema
});

const UserData = mongoose.model('UserData', userDataSchema);

module.exports = UserData;
