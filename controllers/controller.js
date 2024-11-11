import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import Engine from "../models/Engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();


router.post('/addEngine', upload.single('file'), async (req, res) => {
    try {
        let imageFilePath = null;

        if (req.file) {
            const filename = uuidv4() + path.extname(req.file.originalname);
            imageFilePath = path.join(uploadDir, filename);
            fs.writeFileSync(imageFilePath, req.file.buffer); // Сохранение файла на сервере
        }

        await createEngine(res, req.body, imageFilePath);
    } catch (error) {
        console.error('Ошибка при добавлении двигателя:', error.message);
        res.status(500).send({ status: 'error', errors: { field: error.name, message: error.message } });
    }
});

// Маршрут для удаления двигателя по его ID
router.delete('/deleteEngine/:id', async (req, res) => {
    try {
        const engineId = req.params.id;

        const engineInstance = new Engine();
        const result = await engineInstance.deleteEngine(engineId);

        if (!result) {
            return res.status(404).send({ status: 'error', message: 'Двигатель не найден' });
        }

        res.status(200).send({ status: 'success', message: 'Двигатель и его изображение успешно удалены' });
    } catch (error) {
        console.error('Ошибка при удалении двигателя:', error.message);
        res.status(500).send({ status: 'error', message: 'Ошибка при удалении двигателя' });
    }
});


async function createEngine(res, engineData, imageFilePath) {
    const engineInstance = new Engine();

    await engineInstance.addEngine(
        engineData.title,
        engineData.position,
        engineData.installationPlace,
        engineData.inventoryNumber,
        engineData.account,
        engineData.type,
        engineData.power,
        engineData.coupling,
        engineData.status,
        engineData.comments,
        engineData.historyOfTheInstallation,
        engineData.historyOfTheRepair,
        engineData.date,
        imageFilePath,  // Передаем путь к файлу
        engineData.docFromPlace,
        engineData.linkOnAddressStorage
    );

    res.status(201).send({ status: 'success', message: 'Двигатель успешно добавлен' });
}

router.patch('/updateEngine/:id', upload.single('file'), async (req, res) => {
    try {
        const engineId = req.params.id;
        let imageFilePath = req.body.imageFilePath;
        console.log('В update пришли:', req.body);

        // Если новое изображение было загружено, сохраняем его
        if (req.file) {
            const filename = uuidv4() + path.extname(req.file.originalname);
            imageFilePath = path.join(uploadDir, filename);
            fs.writeFileSync(imageFilePath, req.file.buffer); // Сохранение файла на сервере
        }

        // Здесь мы заменяем `place` на `location` в req.body
        const location = req.body.position
        const engineInstance = new Engine();
        await engineInstance.updateEngine(
            engineId,
            req.body.title,
            location,
            req.body.installationPlace,
            req.body.inventoryNumber,
            req.body.accountNumber,
            req.body.type,
            req.body.power,
            req.body.coupling,
            req.body.status,
            req.body.comments,
            imageFilePath === 'null' ? null : imageFilePath, // Передаем null если не было изображения
            req.body.docFromPlace,
            req.body.linkOnAddressStorage
        );

        res.status(200).json({ status: 'success', message: 'Данные двигателя успешно обновлены' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.get('/image/:id', async (req, res) => {
    try {
        const engineId = req.params.id;
        const engine = await EngineModelDB.findOne({ _id: engineId });

        if (!engine || !engine.imageFilePath) {
            return res.status(404).send({ status: 'error', message: 'Изображение не найдено' });
        }

        const imagePath = engine.imageFilePath;

        fs.access(imagePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('Ошибка при доступе к файлу:', err);
                return res.status(404).send('Файл не найден');
            }

            res.sendFile(path.resolve(imagePath));
        });
    } catch (error) {
        console.error('Ошибка при получении изображения:', error.message);
        res.status(500).send({
            status: 'error',
            message: 'Ошибка при получении изображения'
        });
    }
});
// Получение всех двигателей
router.get('/getAllEngines', async (req, res) => {
    try {
        const engineInstance = new Engine();  // Создание экземпляра класса Engine
        const engines = await engineInstance.getAllEngines();  // Вызов метода через экземпляр

        res.status(200).send({ status: 'success', data: engines });
    } catch (error) {
        console.error('Ошибка при получении всех двигателей:', error.message);
        res.status(500).send({ status: 'error', message: error.message });
    }
});



router.post('/addPosition', async (req, res) => {
    try {
        const {
            position: position,
            installationPlace: installationPlace,
        } = req.body;
        // if (!installationPlace) {
        //     installationPlace = undefined;
        // }
        const engineInstance = new Engine();
        await engineInstance.addPosition(
            position,
            installationPlace,
        );

        res.status(201).send({
            status: 'success',
            message: 'Место нахождения успешно добавлено'
        });
    } catch (error) {
        console.error('Ошибка при добавлении местонахождения:', error.message);
        res.status(404).send({
            status: 'error',
            errors: {
                field: error.name,
                message: error.message
            }
        });
    }
});
router.post('/addHistoryRepair', async (req, res) => {
    try {
        const {
            repairType,
            repairDescription,
            repairDate,
            engineId
        } = req.body;

        // Проверка на корректность полученных данных
        if (!engineId || !repairType || !repairDescription || !repairDate) {
            return res.status(400).send({
                status: 'error',
                message: 'Необходимо предоставить все поля: engineId, repairType, repairDescription, repairDate'
            });
        }

        const engineInstance = new Engine();
        await engineInstance.addHistoryRepair(
            engineId,
            repairType,
            repairDescription,
            repairDate
        );

        res.status(201).send({
            status: 'success',
            message: 'Запись истории ремонта успешно добавлена'
        });
    } catch (error) {
        console.error('Ошибка при добавлении истории ремонта:', error.message);
        res.status(500).send({
            status: 'error',
            message: error.message
        });
    }
});

router.get('/getPositions', async (req, res) => {
    try {
        const engineInstance = new Engine();
        const positions = await engineInstance.getPositions();  // Получаем все позиции
        res.status(200).send({
            status: 'success',
            data: positions
        });
    } catch (error) {
        console.error('Ошибка при получении позиций:', error.message);
        res.status(500).send({
            status: 'error',
            message: error.message
        });
    }
});
router.get('/getEngineByLocation', async (req, res) => {
    try {
        const location = decodeURIComponent(req.query.location);
        const engineInstance = new Engine();

        const engines = await engineInstance.getEngineByLocation(location);
        res.status(200).send({
            status: 'success',
            data: engines
        });
    } catch (error) {
        console.error('Ошибка при поиске двигателей по местонахождению:', error.message);
        res.status(404).send({
            status: 'error',
            message: error.message
        });
    }
});
router.get('/getEngineByID', async (req, res) => {
    try {
        const engineId = decodeURIComponent(req.query.engineId);
        console.log('Received Engine ID:', engineId);  // Выводим значение ID для отладки
        const engineInstance = new Engine();
        const engine = await engineInstance.getEngineById(engineId);

        if (!engine) {
            throw new Error('Двигатель не найден');
        }

        res.status(200).send({
            status: 'success',
            data: engine
        });
    } catch (error) {
        console.error('Ошибка при поиске двигателей по ID:', error.message);
        res.status(404).send({
            status: 'error',
            message: error.message
        });
    }
});


// Маршрут для поиска двигателей по месту установки (installationPlace)
router.get('/getEngineByInstallationPlace', async (req, res) => {
    try {
        const installationPlace = decodeURIComponent(req.query.installationPlace);
        const engineInstance = new Engine();
        const engines = await engineInstance.getEngineByInstallationPlace(installationPlace);
        res.status(200).send({
            status: 'success',
            data: engines
        });
    } catch (error) {
        console.error('Ошибка при поиске двигателей по месту установки:', error.message);
        res.status(404).send({
            status: 'error',
            message: error.message
        });
    }
});

// Маршрут для поиска двигателя по инвентарному номеру (inventoryNumber)
router.get('/getEngineByInventoryNumber', async (req, res) => {
    try {
        const inventoryNumber = req.query.inventoryNumber;
        const engineInstance = new Engine();
        const engine = await engineInstance.getEngineByInventoryNumber(inventoryNumber);
        res.status(200).send({
            status: 'success',
            data: engine
        });
    } catch (error) {
        console.error('Ошибка при поиске двигателя по инвентарному номеру:', error.message);
        res.status(404).send({
            status: 'error',
            message: error.message
        });
    }
});

router.delete('/delPosition', async (req, res) => {
    try {
        const {
            position: position
        } = req.body;
        // if (!installationPlace) {
        //     installationPlace = undefined;
        // }
        const engineInstance = new Engine();
        await engineInstance.deletePosition(
            position
        );

        res.status(201).send({
            status: 'success',
            message: 'Место нахождения успешно удалено'
        });
    } catch (error) {
        console.error('Ошибка при удалении местонахождения:', error.message);
        res.status(404).send({
            status: 'error',
            errors: {
                field: error.name,
                message: error.message
            }
        });
    }
});

router.post('/addInstallationPlace', async (req, res) => {
    try {
        const { position, installationPlace } = req.body;

        const engineInstance = new Engine();
        await engineInstance.addInstallationPlaceToPosition(position, installationPlace);

        res.status(201).send({
            status: 'success',
            message: 'Место установки успешно добавлено'
        });
    } catch (error) {
        console.error('Ошибка при добавлении места установки:', error.message);
        res.status(404).send({
            status: 'error',
            errors: {
                field: error.name,
                message: error.message
            }
        });
    }
});
router.delete('/delInstallationPlace', async (req, res) => {
    try {
        const { position, installationPlace } = req.body;

        const engineInstance = new Engine();
        console.log('iinstallationPlace:',installationPlace, 'position:',position)
        await engineInstance.deleteInstallationPlaceFromPosition(position, installationPlace);

        res.status(201).send({
            status: 'success',
            message: 'Место установки успешно удалено'
        });
    } catch (error) {
        console.error('Ошибка при удалении места установки:', error.message);
        res.status(404).send({
            status: 'error',
            errors: {
                field: error.name,
                message: error.message
            }
        });
    }
});
export default router;
