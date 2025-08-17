// server.js (불필요한 부분을 정리한 최종 버전)

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const UserData = require('./models/UserData');

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const MONGODB_URL = "mongodb+srv://soiuser:soi1234@cluster0.dmtk0ea.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv';

// 데이터베이스 연결
mongoose.connect(MONGODB_URL)
  .then(() => console.log('★★★★★ 데이터베이스 연결 성공! ★★★★★'))
  .catch(err => console.error('데이터베이스 연결에 실패했습니다...', err));


// ======== API 만들기 ========

// 구글 시트 문제 데이터를 가져오는 API
app.get('/api/problems', async (req, res) => {
    try {
        // 'node-fetch'를 import하는 줄을 삭제했습니다.
        // 최신 Node.js는 fetch를 기본으로 지원합니다.
        const response = await fetch(GOOGLE_SHEET_URL);
        const tsvText = await response.text();
        res.send(tsvText);
    } catch (error) {
        console.error("구글 시트에서 문제 데이터를 가져오는 데 실패했습니다:", error);
        res.status(500).send("구글 시트 데이터를 가져올 수 없습니다.");
    }
});

// 사용자 데이터 불러오기 API
app.get('/api/data/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const data = await UserData.findOne({ username: username });
        res.json(data || null);
    } catch (error) {
        res.status(500).json({ message: "데이터를 불러오는 데 실패했습니다." });
    }
});

// 사용자 데이터 저장하기 API
app.post('/api/data/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const newData = req.body;
        const updatedData = await UserData.findOneAndUpdate(
            { username: username },
            newData,
            { new: true, upsert: true }
        );
        res.json(updatedData);
    } catch (error) {
        res.status(500).json({ message: "데이터를 저장하는 데 실패했습니다." });
    }
});

// 서버 실행
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});