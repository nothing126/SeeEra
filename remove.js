import { unlink } from "fs/promises";
import { errToLogFile } from "./errwriter.js";
export async function remove_file(path) {
  try {
    await unlink(path);
  } catch (e) {
    await errToLogFile(`error while removing file, ERROR${e}, FILE: remove.js`);
  }
}
