import { appendFile } from "fs/promises";
import { log_path } from "./config.js";
export async function writeToLogFile(text) {
  try {
    // Путь к файлу
    const filePath = log_path;

    // Добавляем текущую дату к тексту
    const logEntry = `${new Date().toISOString()}: ${text}\n`;

    // Записываем текст в файл
    await appendFile(filePath, logEntry);
  } catch (e) {
    await writeToLogFile(
      `ERROR WHILE LOG WRITING: ERROR: ${e} , FILE: logwriter.js}`,
    );
  }
}
