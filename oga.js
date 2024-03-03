import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import installer from "@ffmpeg-installer/ffmpeg";
import { createWriteStream } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { remove_file } from "./remove.js";
import { errToLogFile } from "./errwriter.js";
import { voices_path } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
class OgaConverter {
  constructor() {
    ffmpeg.setFfmpegPath(installer.path);
  }
  async toMp3(input, output) {
    try {
      const outputPath = resolve(dirname(input), `${output}.mp3`);
      return new Promise((resolve) => {
        ffmpeg(input)
          .inputOption("-t 30")
          .output(outputPath)
          .on("end", async () => {
            await remove_file(input);
            await resolve(outputPath);
          })
          .on("error", (err) => console.log(err.message))
          .run();
      });
    } catch (e) {
      await errToLogFile(
        `Error while creating mp3, ERROR: ${e} , FILE: oga.js`,
      );
    }
  }

  async create(url, filename) {
    try { 
      const ogaPath = resolve(__dirname, voices_path, `${filename}.oga`);
      const response = await axios({
        method: "get",
        url,
        responseType: "stream",
      });
      return new Promise((resolve) => {
        const stream = createWriteStream(ogaPath);
        response.data.pipe(stream);
        stream.on("finish", () => resolve(ogaPath));
      });
    } catch (e) {
      await errToLogFile(`error while creating oga, ERROR:${e}, FILE: oga.js`);
    }
  }
}

export const oga = new OgaConverter();
