import mongoose from 'mongoose';

const installationHistorySchema = new mongoose.Schema({
    installationPlace: String,
    status: String,
    date: String
});

const repairHistorySchema = new mongoose.Schema({
    repairType: String,
    repairDescription: String,
    repairDate: String
});

const engineSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    title: { type: String, required: true, unique: true },
    location: String,
    installationPlace: String,
    inventoryNumber: String,
    accountNumber: String,
    type: String,
    power: String,
    coupling: String,
    status: String,
    comments: String,
    docFromPlace: { type: String, required: false },
    linkOnAddressStorage: { type: String, required: false },
    historyOfTheInstallation: [installationHistorySchema],
    historyOfTheRepair: [repairHistorySchema],
    date: String,
    imageFilePath: String  // Путь к файлу на сервере
});

const EngineModelDB = mongoose.model('Engine', engineSchema);

export default EngineModelDB;