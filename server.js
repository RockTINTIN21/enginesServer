import express from 'express';
import cors from 'cors';
import path, { resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import mongoose from 'mongoose';
import controller from './controllers/controller.js';
import session from 'express-session';
import fs from "fs";

const app = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = pathToFileURL(resolve(__dirname, 'serverConfig.js'));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());

// Проверяем наличие файла serverConfig.js
if (!fs.existsSync(configPath)) {
    console.log('Запуск сервера не удался, файл serverConfig.js не существует. Пожалуйста, создайте его по примеру файла server/example.txt');
    process.exit(1); // Останавливаем сервер
}

// Динамически загружаем конфигурацию, если файл существует
import(configPath.href) // Используем href, чтобы получить URL в виде строки
    .then((config) => {
        console.log('Конфигурация загружена успешно:', config.default);

        mongoose.connect(config.default.mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).then(() => {
            console.log('Успешное подключение к MongoDB Atlas');
        }).catch((error) => {
            console.error('Ошибка подключения к MongoDB Atlas:', error);
            process.exit(1); // Останавливаем сервер при ошибке подключения
        });

        app.use('/api', controller);

        app.use(session({
            secret: 'q4werty123uasdg',
            resave: false,
            saveUninitialized: true,
            cookie: { secure: false }
        }));

        app.post('/login', (req, res) => {
            const { username, password } = req.body;
            if (username === config.default.login && password === config.default.password) {
                req.session.user = { username };
                res.json({ status: 'success', message: 'Authentication successful!' });
            } else {
                res.status(401).json({ status: 'error', message: 'Authentication failed' });
            }
        });

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../public', 'index.html'));
        });

        const port = config.default.backendPort || 3000;
        app.listen(port, '0.0.0.0', () => {
            console.log(`Сервер запущен на порту ${port}, сайт доступен по ссылке: http://${config.default.frontendIP}/`);
        });
    })
    .catch((err) => {
        console.error('Ошибка при загрузке конфигурации:', err);
        process.exit(1); // Останавливаем сервер при ошибке импорта конфигурации
    });
