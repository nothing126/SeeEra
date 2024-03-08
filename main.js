import { Telegraf, session } from "telegraf";
import { Markup } from "telegraf";
import { writeToLogFile } from "./logwriter.js";
import { tgKey } from "./config.js";
import { errToLogFile } from "./errwriter.js";
import { message } from "telegraf/filters";
import { openai } from "./openai.js";
import { downloadImage } from "./image.js";
import { oga } from "./oga.js";
import { remove_file } from "./remove.js";
import { RandN } from "./rand.js";
import { code } from "telegraf/format";
import fs from "fs";
const bot = new Telegraf(tgKey);

const INITIAL_SESSION = {
  messages: [],
};

bot.use(session());

bot.command("start", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  try {
    const waitingMessage = await ctx.reply("⏳");
    await writeToLogFile(`User: @${ctx.message.from.username} 
        (${ctx.message.from.id}) enter start command`);
    await ctx.deleteMessage(waitingMessage.message_id);
    await ctx.reply(
      "Для того чтобы начать диалог выберите нужный вам режим",
      Markup.inlineKeyboard([
        [Markup.button.callback("Разговор с ChatGPT", "gpt")],
        [Markup.button.callback("Генерация картинок", "dalle")],
        [Markup.button.callback("голос в текст", "v2t")],
        [Markup.button.callback("текст в голос", "tts")],
        [Markup.button.callback("информация", "info")],
      ]),
    );
  } catch (e) {
    await errToLogFile(`ERROR WHILE START COMMAND: {
        User: @${ctx.message.from.username} 
        (${ctx.message.from.id}),
        ERROR: ${e} , 
        FILE: main.js}`);
  }
});
bot.action("tts", async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    ctx.session.mode = "tts";
    ctx.reply("Введите текст который хотите озвучить");
  } catch (e) {
    await ctx.reply("Что-то пошло не так");
    await errToLogFile(`ERROR WHILE PROCESSING tts STATE: {
       User: @${ctx.message.from.username} 
        (${ctx.message.from.id}),
        ERROR: ${e} , 
        FILE: main.js}`);
  }
});
bot.action("info", async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    const waitingMessage = await ctx.reply("⏳");
    await writeToLogFile(`User: @${ctx.message.from.username} 
        (${ctx.message.from.id}) enter info command`);
    ctx.session.mode = "info";
    await ctx.deleteMessage(waitingMessage.message_id);
    await ctx.reply(
      "Вас приветствует чат бот с исскувственным интелектом SeeEraAI. Он позволит вам использовать последнюю версию chat-GPT-4 для генерации и работы с текстом, " +
        "а также анализа картинок с последующим ответом на интересующие вас вопросы. Также бот позволяет генерировать картинки с помощью новейшей генеративной " +
        "модели Dall-e-3, что обеспечивает высокую чувствительность к деталям и высокое качество изображений. Кроме этого бот может анализировать голосовые сообщения " +
        "и переводить их в текст используя whisper-1 благодаря которому бот способен понимать свыше сотни языков в числе которых русский, английскй и прочие. Все запросы " +
        "бот может принимать как в текстовом так и в аудио формате, что упрощает взаимодействие со свеми необходимыми функциями. Для более подробной информации рекомендую " +
        "перейти на github репозиторий проекта: https://github.com/nothing126/openaihub там вы найдете все использованные технологии исходный код и прочее." +
        "Для использования бота нужно выйти с этого режима используя кнопку внизу, а далее выберите режим" +
        "Для связи с администратором обращайтесь на email forgptjs12@gmail.com",
      Markup.inlineKeyboard([Markup.button.callback("Выйти", "exit")]),
    );
  } catch (e) {
    await ctx.reply("Что-то пошло не так");
    await errToLogFile(`ERROR WHILE PROCESSING INFO STATE: {
       User: @${ctx.message.from.username} 
        (${ctx.message.from.id}),
        ERROR: ${e} , 
        FILE: main.js}`);
  }
});

bot.action("gpt", async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    ctx.session.mode = "gpt";
    await ctx.reply(
      "Отправьте свой запросдля ChatGPT в текстовом или аудио формате",
    );
  } catch (e) {
    await ctx.reply(
      "Что-то пошло не так, попробуйте заново выбрать режим или ввести команду /start",
    );
    await errToLogFile(`ERROR WHILE PROCESSING DALLE STATE: {
        User: @${ctx.message.from.username} 
        (${ctx.message.from.id}),
         ERROR: ${e} ,
          FILE: main.js}`);
  }
});

bot.action("dalle", async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    ctx.session.mode = "dalle";
    await ctx.reply(
      "Отправьте ваш ваш запрос в текстовом или аудио формате для генерации картинок",
    );
  } catch (e) {
    await ctx.reply(
      "Что-то пошло не так, попробуйте заново выбрать режим или ввести команду /start",
    );
    await errToLogFile(`ERROR WHILE PROCESSING DALLE STATE: {
       User: @${ctx.message.from.username} 
        (${ctx.message.from.id}),
        ERROR: ${e} , 
        FILE: main.js}`);
  }
});

bot.action("v2t", async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    ctx.session.mode = "v2t";
    await ctx.reply(
      "Отправьте или перешлите голосовое сообщение для перевода голос в текст",
    );
  } catch (e) {
    await ctx.reply(
      "Что-то пошло не так, попробуйте заново выбрать режим или ввести команду /start",
    );
    await errToLogFile(`ERROR WHILE PROCESSING  V2T STATE: {
        User: @${ctx.message.from.username} 
        (${ctx.message.from.id}),
         ERROR: ${e} , 
         FILE: main.js}`);
  }
});

bot.on(message("text"), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    switch (ctx.session.mode) {
      case "gpt":
        await GPT_t(ctx);
        break;

      case "dalle":
        await dalle_t(ctx);
        break;

      case "v2t":
        await v2t_t(ctx);
        break;
      case "tts":
        await tts_t(ctx);
        break;

      default:
        await ctx.reply(
          "Что-то пошло не так, попробуйте заново выбрать режим или ввести команду /start",
        );
    }
  } catch (e) {
    await ctx.reply(
      "Что-то пошло не так, попробуйте заново выбрать режим или ввести команду /start",
    );
    await errToLogFile(`ERROR WHILE HANDLING TEXT MESSAGE: {
        User: @${ctx.message.from.username} 
        (${ctx.message.from.id}),       
         ERROR: ${e} ,
         FILE: main.js}`);
  }
});

bot.on(message("voice"), async (ctx) => {
  try {
    switch (ctx.session.mode) {
      case "gpt":
        await GPT_v(ctx);
        break;

      case "dalle":
        await dalle_v(ctx);
        break;

      case "v2t":
        await v2t_v(ctx);
        break;

      case "tts":
        await tts_v(ctx);
        break;

      default:
        await ctx.reply(
          "Что-то пошло не так, попробуйте заново выбрат режим или ввести команду /start",
        );
    }
  } catch (e) {
    await ctx.reply(
      "Что-то пошло не так, попробуйте заново выбрать режим или ввести команду /start",
    );
    await errToLogFile(`ERROR WHILE HANDLING VOICE MESSAGE: {
        User: @${ctx.message.from.username} 
        (${ctx.message.from.id}),
        ERROR: ${e} , 
        FILE: main.js}`);
  }
});

async function GPT_t(ctx) {
  ctx.session ??= INITIAL_SESSION;
  try {
    const waitingMessage = await ctx.reply("⏳");
    await writeToLogFile(`User: @${ctx.message.from.username} 
        (${ctx.message.from.id}) make GPT text request`);

    ctx.session.messages.push({
      role: openai.roles.USER,
      content: ctx.message.text,
    });

    const rsp = await openai.chat_gpt(ctx.session.messages);
    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: rsp,
    });

    await ctx.deleteMessage(waitingMessage.message_id);

    await ctx.reply(
      String(rsp),
      Markup.inlineKeyboard([Markup.button.callback("Выйти", "exit")]),
    );
  } catch (e) {
    await ctx.reply(
      "Что-то пошло не так, попробуйте заново выбрать режим или ввести команду /start",
    );
    await errToLogFile(`ERROR IN GPT TEXT REQUEST: {
        User: @${ctx.message.from.username} 
        (${ctx.message.from.id}),        
        ERROR: ${e} ,
         FILE: main.js}`);
  }
}

async function GPT_v(ctx) {
  ctx.session ??= INITIAL_SESSION;
  try {
    await writeToLogFile(`User: @${ctx.message.from.username} 
        (${ctx.message.from.id}) make GPT voice request`);

    const waitingMessage = await ctx.reply("⏳");
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const user_id = String(ctx.message.from.id);
    const ogaPath = await oga.create(link.href, user_id);
    const filename = await RandN();
    const mp3Path = await oga.toMp3(ogaPath, filename);
    const txt = await openai.transcription(mp3Path);
    await ctx.reply(`Ваш запрос: ${String(txt)}`);

    ctx.session.messages.push({
      role: openai.roles.USER,
      content: txt,
    });

    const rsp = await openai.chat_gpt(ctx.session.messages);
    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: rsp,
    });

    await ctx.deleteMessage(waitingMessage.message_id);

    await ctx.reply(
      String(rsp),
      Markup.inlineKeyboard([Markup.button.callback("Выйти", "exit")]),
    );
  } catch (e) {
    await ctx.reply(
      "Что-то пошло не так, попробуйте заново выбрать режим или ввести команду /start",
    );
    await errToLogFile(`ERROR IN GPT VOICE REQUEST : {
        User: @${ctx.message.from.username} 
        (${ctx.message.from.id}), 
                ERROR: ${e} , 
            FILE: main.js}`);
  }
}

async function dalle_t(ctx) {
  ctx.session ??= INITIAL_SESSION;
  try {
    await writeToLogFile(
      `User: @${ctx.message.from.username} 
            (${ctx.message.from.id}) make dall-e-3 text request`,
    );

    const waitingMessage = await ctx.reply("⏳");

    const url = await openai.dalle(ctx.message.text);
    const filename = await RandN();
    const image_path = await downloadImage(url, filename);
    await ctx.replyWithDocument({ source: image_path });
    await ctx.deleteMessage(waitingMessage.message_id);

    ctx.reply("следующая генерация доступна через минуту");

    ctx.reply(
      "хотите выйти?",
      Markup.inlineKeyboard([Markup.button.callback("Выйти", "exit")]),
    );
    await remove_file(image_path);
  } catch (e) {
    await ctx.reply(
      "Что-то пошло не так, попробуйте заново выбрать режим или ввести команду /start",
    );
    await errToLogFile(`ERROR IN DALLE TEXT REQUEST: {
            User: ${ctx.message.from.id} 
            ERROR: ${e} ,
             FILE: main.js}`);
  }
}

async function dalle_v(ctx) {
  ctx.session ??= INITIAL_SESSION;
  try {
    const waitingMessage = await ctx.reply("⏳");
    await writeToLogFile(
      `User: @${ctx.message.from.username} 
            (${ctx.message.from.id}) make dall-e-e voice request`,
    );

    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const filename = await RandN();
    const ogaPath = await oga.create(link.href, filename);
    const mp3Path = await oga.toMp3(ogaPath, filename);
    const text = await openai.transcription(mp3Path);

    await ctx.reply(code(`ваш запрос: ${text}`));

    const url = await openai.dalle(String(text));
    const image_path = await downloadImage(url, filename);
    await ctx.replyWithDocument({ source: image_path });
    await ctx.deleteMessage(waitingMessage.message_id);
    ctx.reply("следующая генерация доступна через минуту");

    ctx.reply(
      "хотите выйти?",
      Markup.inlineKeyboard([Markup.button.callback("Выйти", "exit")]),
    );
    await remove_file(image_path);
  } catch (e) {
    await ctx.reply(
      "Что-то пошло не так, попробуйте заново выбрат режим или ввести команду /start",
    );
    await errToLogFile(`ERROR IN DALLE VOICE REQUEST: {
        User: @${ctx.message.from.username} 
        (${ctx.message.from.id})         
        ERROR: ${e} , 
        FILE: main.js}`);
  }
}

async function v2t_v(ctx) {
  ctx.session ??= INITIAL_SESSION;
  try {
    await writeToLogFile(`User: @${ctx.message.from.username}
         (${ctx.message.from.id}) make v2t voice request`);

    await ctx.reply("отправьте или перешлите голосовое сообщение");
    const waitingMessage = await ctx.reply("⏳");

    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const filename = await RandN();
    const ogaPath = await oga.create(link.href, filename);
    const mp3Path = await oga.toMp3(ogaPath, filename);
    const text = await openai.transcription(mp3Path);
    await ctx.deleteMessage(waitingMessage.message_id);
    await ctx.reply(
      `текст сообщения: ${text}`,
      Markup.inlineKeyboard([Markup.button.callback("Выйти", "exit")]),
    );
    await remove_file(mp3Path);
  } catch (e) {
    await ctx.reply("что то пошло не так, повторите попытку");
    await errToLogFile(`ERROR IN V2T VOICE REQUEST: {
            User: @${ctx.message.from.username} 
            (${ctx.message.from.id}),
            ERROR: ${e} , 
            FILE: main.js}`);
  }
}
async function v2t_t(ctx) {
  ctx.session ??= INITIAL_SESSION;
  try {
    await writeToLogFile(
      `User: @${ctx.message.from.username} 
            (${ctx.message.from.id}) make v2t text request`,
    );

    const waitingMessage = await ctx.reply("⏳");
    ctx.reply(
      "отправьте или перешлите голосовое сообщение",
      Markup.inlineKeyboard([Markup.button.callback("Выйти", "exit")]),
    );
    await ctx.deleteMessage(waitingMessage.message_id);
  } catch (e) {
    await ctx.reply("что то пошло не так, повторите попытку");
    await errToLogFile(`ERROR IN V2T TEXT REQUEST: {
        User: @${ctx.message.from.username} 
        (${ctx.message.from.id})        
        ERROR: ${e} ,
        FILE: main.js}`);
  }
}

async function tts_v(ctx) {
  ctx.session ??= INITIAL_SESSION;
  try {
    ctx.reply(
      "повторите попытку и отправьте ТЕКСТВОЕ сообщение",
      Markup.inlineKeyboard([Markup.button.callback("Выйти", "exit")]),
    );
    await writeToLogFile(
      `User: @${ctx.message.from.username} 
            (${ctx.message.from.id}) make tts voice request`,
    );
  } catch (e) {
    await ctx.reply("что то пошло не так, повторите попытку");
    await errToLogFile(`ERROR IN tts VOICE REQUEST: {
        User: @${ctx.message.from.username} 
        (${ctx.message.from.id})        
        ERROR: ${e} ,
        FILE: main.js}`);
  }
}
async function tts_t(ctx) {
  ctx.session ??= INITIAL_SESSION;
  try {
    const waitingMessage = await ctx.reply("⏳");
    await writeToLogFile(
      `User: @${ctx.message.from.username} 
            (${ctx.message.from.id}) make tts text request`,
    );

    const audioFilePath = await openai.tts(ctx.message.text);

    // Читаем аудиофайл
    const audioFile = fs.readFileSync(audioFilePath);
    await ctx.deleteMessage(waitingMessage.message_id);
    // Отправляем голосовое сообщение
    await ctx.replyWithVoice({ source: audioFile });
    ctx.reply(
      "хотите выйти?",
      Markup.inlineKeyboard([Markup.button.callback("Выйти", "exit")]),
    );
    await remove_file(audioFilePath);
  } catch (e) {
    await ctx.reply("что то пошло не так, повторите попытку");
    await errToLogFile(`ERROR IN tts TEXT REQUEST: {
        User: @${ctx.message.from.username} 
        (${ctx.message.from.id})        
        ERROR: ${e} ,
        FILE: main.js}`);
  }
}

bot.command("new", async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    await writeToLogFile(
      `User: @${ctx.message.from.username} 
            (${ctx.message.from.id}) start new conversation`,
    );

    await ctx.reply(
      "Выберите нужный вам режим",
      Markup.inlineKeyboard([
        [Markup.button.callback("Разговор с ChatGPT", "gpt")],
        [Markup.button.callback("Генерация картинок", "dalle")],
        [Markup.button.callback("анализ картинки", "vision")],
        [Markup.button.callback("голос в текст", "v2t")],
        [Markup.button.callback("информация", "info")],
        [Markup.button.callback("текст в голос", "tts")],
      ]),
    );
  } catch (e) {
    await ctx.reply(
      "вы не авторизованы, повторите попытку или свяжитесь с администратором email forgptjs12@gmail.com ",
    );
    await errToLogFile(`ERROR WHILE START COMMAND: {
        User: @${ctx.message.from.username} 
        (${ctx.message.from.id})       
        ERROR: ${e} , 
        FILE: main.js}`);
  }
});

bot.action("exit", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  try {
    await ctx.reply(
      "Вы вышли из режима. Выберите режим:",
      Markup.inlineKeyboard([
        [Markup.button.callback("Разговор с ChatGPT", "gpt")],
        [Markup.button.callback("Генерация картинок", "dalle")],
        [Markup.button.callback("анализ картинки", "vision")],
        [Markup.button.callback("голос в текст", "v2t")],
        [Markup.button.callback("информация", "info")],
        [Markup.button.callback("текст в голос", "tts")],
      ]),
    );
  } catch (e) {
    await ctx.reply("что то пошло не так, повторите попытку");
    await errToLogFile(`ERROR IN V2T TEXT REQUEST: {
        User: @${ctx.message.from.username} 
        (${ctx.message.from.id})     
        ERROR: ${e} ,
        FILE: main.js}`);
  }
});
bot.launch().then((qwe) => console.log("bot started successful", qwe));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
