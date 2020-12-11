const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const SQLite = require("better-sqlite3");
const sql = new SQLite('./scores.sqlite');

client.on("ready", () => {
  const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'scores';").get();
  if (!table['count(*)']) {
    sql.prepare("CREATE TABLE scores (id TEXT PRIMARY KEY, user TEXT, guild TEXT, points INTEGER, level INTEGER);").run();
    sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  client.getScore = sql.prepare("SELECT * FROM scores WHERE user = ? AND guild = ?");
  client.setScore = sql.prepare("INSERT OR REPLACE INTO scores (id, user, guild, points) VALUES (@id, @user, @guild, @points);");
});

client.on("message", message => {
  if (message.author.bot) return;
  let score;
  if (message.guild) {
    score = client.getScore.get(message.author.id, message.guild.id);
    if (!score) {
      score = { id: `${message.guild.id}-${message.author.id}`, user: message.author.id, guild: message.guild.id, points: 0 }
    }
    
    client.setScore.run(score);
  }
  if (message.content.indexOf(config.prefix) !== 0) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if(command === "points") {
    return message.reply(`You currently have ${score.points} points! <a:HOT_TAsHellmo:771159815178158080>`);
  }
  if(command === "give") {
    if(!message.author.id === "324911767274651648") return message.reply("You're not TA, you can't do that!");


  
    const user = message.mentions.users.first() || client.users.get(args[0]);
    if(!user) return message.reply("You must mention someone or give their ID!");
  
    const pointsToAdd = parseInt(args[1], 10);
    if(!pointsToAdd) return message.reply("You didn't tell me how many points to give...")
  
    let userscore = client.getScore.get(user.id, message.guild.id);
    
    if (!userscore) {
      userscore = { id: `${message.guild.id}-${user.id}`, user: user.id, guild: message.guild.id, points: 0 }
    }
    userscore.points += pointsToAdd;
  
    let userLevel = Math.floor(0.1 * Math.sqrt(score.points));
    userscore.level = userLevel;
 
    client.setScore.run(userscore);
   

    return message.channel.send(`**${pointsToAdd}** points given to **${user.username}** and now stands at **${userscore.points}** points! <a:HOT_TAsHellmo:771159815178158080>`);

  }
  
  if(command === "leaderboard") {
    const top10 = sql.prepare("SELECT * FROM scores WHERE guild = ? ORDER BY points DESC LIMIT 10;").all(message.guild.id);
  
  const embed = new Discord.RichEmbed()
    .setTitle("<a:blue_fire:768053173646000138>【ＬＥＡＤＥＲＢＯＡＲＤ】<a:blue_fire:768053173646000138>")
    .setAuthor(client.user.username, client.user.avatarURL)
    .setDescription("Our top 10 points leaders! <a:HOT_TAsHellmo:771159815178158080>")
    .setColor(0x00AE86);

    for(const data of top10) {
  embed.addField(client.users.get(data.user).tag, `${data.points} points`);
    }
    return message.channel.send({embed});
}
});

client.login(config.token);