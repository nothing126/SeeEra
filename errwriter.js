import { appendFile } from "fs/promises";
import { err_path } from "./config.js";
export async function errToLogFile(text) {
  try {
    // Путь к файлу
    const filePath = err_path;

    // Добавляем текущую дату к тексту
    const logEntry = `${new Date().toISOString()}: ${text}\n`;

    // Записываем текст в файл
    await appendFile(filePath, logEntry);
  } catch (e) {
    await errToLogFile(
      `ERROR WHILE  ERR LOG WRITING: ERROR: ${e} , FILE: errwriter.js}`,
    );
  }
}
