import mongoose from 'mongoose';

// Определяем схему для местоположений
const positionSchema = new mongoose.Schema({
    position: { type: String, required: true },  // Хранит значение в исходном виде
    positionLowerCase: { type: String, required: true, unique: true },  // Хранит значение в нижнем регистре для проверки уникальности
    installationPlaces: [String]  // Массив мест установки
});

const PositionModelDB = mongoose.model('Position', positionSchema);

export default PositionModelDB;