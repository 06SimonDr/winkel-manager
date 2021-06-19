// We import modules.
const url = require("url");
const path = require("path");
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const Strategy = require("passport-discord").Strategy;
const config = require("../config.js");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const Discord = require("discord.js");
const GuildSettings = require("../models/settings");
const winkelSchema  = require('../models/winkels')
const embedSchema = require('../models/winkel-embed')
const timeSchema = require("../models/time")

// We instantiate express app and the session store.
const app = express();
const MemoryStore = require("memorystore")(session);

// We export the dashboard as a function which we call in ready event.
module.exports = async (client) => {
  // We declare absolute paths.
  const dataDir = path.resolve(`${process.cwd()}${path.sep}dashboard`); // The absolute path of current this directory.
  const templateDir = path.resolve(`${dataDir}${path.sep}templates`); // Absolute path of ./templates directory.

  // Deserializing and serializing users without any additional logic.
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  // Validating the url by creating a new instance of an Url then assign an object with the host and protocol properties.
  // If a custom domain is used, we take the protocol, then the hostname and then we add the callback route.
  // Ex: Config key: https://localhost/ will have - hostname: localhost, protocol: http
  
  var callbackUrl;
  var domain;
  
  try {
    const domainUrl = new URL(config.domain);
    domain = {
      host: domainUrl.hostname,
      protocol: domainUrl.protocol
    };
  } catch (e) {
    console.log(e);
    throw new TypeError("Invalid domain specific in the config file.");
  }
  
  if (config.usingCustomDomain) {
    callbackUrl =  `${domain.protocol}//${domain.host}/callback`
  } else {
    callbackUrl = `${domain.protocol}//${domain.host}${config.port == 80 ? "" : `:${config.port}`}/callback`;
  }

  // We set the passport to use a new discord strategy, we pass in client id, secret, callback url and the scopes.
  /** Scopes:
   *  - Identify: Avatar's url, username and discriminator.
   *  - Guilds: A list of partial guilds.
  */
  passport.use(new Strategy({
    clientID: config.id,
    clientSecret: config.clientSecret,
    callbackURL: callbackUrl,
    scope: ["identify", "guilds"]
  },
  (accessToken, refreshToken, profile, done) => { // eslint-disable-line no-unused-vars
    // On login we pass in profile with no logic.
    process.nextTick(() => done(null, profile));
  }));

  // We initialize the memorystore middleware with our express app.
  app.use(session({
    store: new MemoryStore({ checkPeriod: 86400000 }),
    secret: "#@%#&^$^$%@$^$&%#$%@#$%$^%&$%^#$%@#$%#E%#%@$FEErfgr3g#%GT%536c53cc6%5%tv%4y4hrgrggrgrgf4n",
    resave: false,
    saveUninitialized: false,
  }));

  // We initialize passport middleware.
  app.use(passport.initialize());
  app.use(passport.session());

  // We bind the domain.
  app.locals.domain = config.domain.split("//")[1];

  // We set out templating engine.
  app.engine("html", ejs.renderFile);
  app.set("view engine", "html");

  // We initialize body-parser middleware to be able to read forms.
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  
  // We host all of the files in the assets using their name in the root address.
  // A style.css file will be located at http://<your url>/style.css
  // You can link it in any template using src="/assets/filename.extension"
  app.use("/", express.static(path.resolve(`${dataDir}${path.sep}assets`)));
  
  // We declare a renderTemplate function to make rendering of a template in a route as easy as possible.
  const renderTemplate = (res, req, template, data = {}) => {
    // Default base data which passed to the ejs template by default. 
    const baseData = {
      bot: client,
      path: req.path,
      user: req.isAuthenticated() ? req.user : null
    };
    // We render template using the absolute path of the template and the merged default data with the additional data provided.
    res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(baseData, data));
  };

  // We declare a checkAuth function middleware to check if an user is logged in or not, and if not redirect him.
  const checkAuth = (req, res, next) => {
    // If authenticated we forward the request further in the route.
    if (req.isAuthenticated()) return next();
    // If not authenticated, we set the url the user is redirected to into the memory.
    req.session.backURL = req.url;
    // We redirect user to login endpoint/route.
    res.redirect("/login");
  }

  // Login endpoint.
  app.get("/login", (req, res, next) => {
    // We determine the returning url.
    if (req.session.backURL) {
      req.session.backURL = req.session.backURL; // eslint-disable-line no-self-assign
    } else if (req.headers.referer) {
      const parsed = url.parse(req.headers.referer);
      if (parsed.hostname === app.locals.domain) {
        req.session.backURL = parsed.path;
      }
    } else {
      req.session.backURL = "/";
    }
    // Forward the request to the passport middleware.
    next();
  },
  passport.authenticate("discord"));

  // Callback endpoint.
  app.get("/callback", passport.authenticate("discord", { failureRedirect: "/" }), /* We authenticate the user, if user canceled we redirect him to index. */ (req, res) => {
    // If user had set a returning url, we redirect him there, otherwise we redirect him to index.
    if (req.session.backURL) {
      const url = req.session.backURL;
      req.session.backURL = null;
      res.redirect(url);
    } else {
      res.redirect("/");
    }
  });

  // Logout endpoint.
  app.get("/logout", function (req, res) {
    // We destroy the session.
    req.session.destroy(() => {
      // We logout the user.
      req.logout();
      // We redirect user to index.
      res.redirect("/");
    });
  });

  // Index endpoint.
  app.get("/", (req, res) => {
    renderTemplate(res, req, "index.ejs");
  });

  // Dashboard endpoint.
  app.get("/dashboard", checkAuth, (req, res) => {
    renderTemplate(res, req, "dashboard.ejs", { perms: Discord.Permissions });
  });

  // Menu endpoint.
  app.get("/dashboard/:guildID", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    var guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = guild.members.cache.get(req.user.id);
    if(!member){
      try{ await guild.members.fetch();
        member = guild.members.cache.get(req.user.id);
      } catch{ console.error("Couldn't fetch the members of " + guild.id); }}
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD")) return res.redirect("/dashboard");
  
    renderTemplate(res, req, "menu.ejs", { guild, alert: null });
  });

  // Settings endpoint.
  app.get("/dashboard/:guildID/algemeen", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    var guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = guild.members.cache.get(req.user.id);
    if(!member){
      try{ await guild.members.fetch();
        member = guild.members.cache.get(req.user.id);
      } catch{ console.error("Couldn't fetch the members of " + guild.id); }}
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD")) return res.redirect("/dashboard");

    // We retrive the settings stored for this guild.
    var storedSettings = await GuildSettings.findOne({ serverId: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        serverId: guild.id
      });
      await newSettings.save().catch(()=>{});
      storedSettings = await GuildSettings.findOne({ serverId: guild.id });
    }
  
    renderTemplate(res, req, "settings.ejs", { guild, settings: storedSettings, alert: null });
  });

    // Settings endpoint.
    app.post("/dashboard/:guildID/algemeen", checkAuth, async (req, res) => {
        // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
        const guild = client.guilds.cache.get(req.params.guildID);
        if (!guild) return res.redirect("/dashboard");
        const member = guild.members.cache.get(req.user.id);
        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has("MANAGE_GUILD")) return res.redirect("/dashboard");
        // We retrive the settings stored for this guild.
        var storedSettings = await GuildSettings.findOne({ serverId: guild.id });
        if (!storedSettings) {
          // If there are no settings stored for this guild, we create them and try to retrive them again.
          const newSettings = new GuildSettings({
            serverId: guild.id
          });
          await newSettings.save().catch(()=>{});
          storedSettings = await GuildSettings.findOne({ serverId: guild.id });
        }
      
        // We set the prefix of the server settings to the one that was sent in request from the form.
        storedSettings.prefix = req.body.prefix;
        // We save the settings.
        await storedSettings.save().catch(() => {});

        // We render the template with an alert text which confirms that settings have been saved.
        renderTemplate(res, req, "settings.ejs", { guild, settings: storedSettings, alert: "Your settings have been saved." });
    });

    // Settings endpoint.
  app.get("/dashboard/:guildID/winkels", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    var guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = guild.members.cache.get(req.user.id);
    if(!member){
      try{ await guild.members.fetch();
        member = guild.members.cache.get(req.user.id);
      } catch{ console.error("Couldn't fetch the members of " + guild.id); }}
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD")) return res.redirect("/dashboard");

    var embedSettings = await embedSchema.find({ serverId: guild.id })
    var winkelsSettings = await winkelSchema.find({ serverId: guild.id });
    renderTemplate(res, req, "winkels.ejs", { guild, settings: { winkelsSettings,  embedSettings}, alert: null });
  });

    // Settings endpoint.
    app.post("/dashboard/:guildID/winkels", checkAuth, async (req, res) => {
        // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
        const guild = client.guilds.cache.get(req.params.guildID);
        if (!guild) return res.redirect("/dashboard");
        const member = guild.members.cache.get(req.user.id);
        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has("MANAGE_GUILD")) return res.redirect("/dashboard");

        var newSettings2 = await embedSchema.findOne({ serverId: guild.id })
        if(!newSettings2) {
          var newSettings2 = await new embedSchema({ serverId: guild.id });
        }
        if(req.body.channel) newSettings2.channelId = req.body.channel
        if(req.body.title) newSettings2.title = req.body.title
        if(req.body.description2) newSettings2.description = req.body.description2
        if(req.body.color) newSettings2.color = req.body.color
        if(req.body.image) newSettings2.image = req.body.image
        if(req.body.footer) newSettings2.footer = req.body.footer
        await newSettings2.save().catch((err) => {console.log(err)});

        if (req.body.task === "EDIT" || req.body.task === "NEW") {
          if (req.body.task === "EDIT") var newSettings = await winkelSchema.findById(req.body.storeId);
          if (req.body.task === "NEW") var newSettings = await new winkelSchema({ serverId: guild.id });
          if (req.body.name) newSettings.name = req.body.name
          if (req.body.description) newSettings.description = req.body.description;
          if (req.body.stad) newSettings.stad = req.body.stad;
          if (req.body.location) newSettings.location = req.body.location;
          await newSettings.save().catch((err) => {console.log(err)});
        }

        if (req.body.task === "DELETE") var newSettings = await winkelSchema.deleteOne({ _id: req.body.storeId });

        var embedSettings = await embedSchema.find({ serverId: guild.id })
        var winkelsSettings = await winkelSchema.find({ serverId: guild.id });
        renderTemplate(res, req, "winkels.ejs", { guild, settings: { winkelsSettings,  embedSettings}, alert: "Jouw instellingen zijn opgeslagen!" });
    });

    app.get("/dashboard/:guildID/statistieken", checkAuth, async (req, res) => {
      // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
      var guild = client.guilds.cache.get(req.params.guildID);
      if (!guild) return res.redirect("/dashboard");
      const member = guild.members.cache.get(req.user.id);
      if(!member){
        try{ await guild.members.fetch();
          member = guild.members.cache.get(req.user.id);
        } catch{ console.error("Couldn't fetch the members of " + guild.id); }}
      if (!member) return res.redirect("/dashboard");
      if (!member.permissions.has("MANAGE_GUILD")) return res.redirect("/dashboard");
  
      const grafiekSettings = await timeSchema.find()

      const dagen = [-7, -6, -5, -4, -3, -2, -1, 0]
    function getDay(day){
    var today = new Date();
    var targetday_milliseconds=today.getTime() + 1000*60*60*24*day;          
    today.setTime(targetday_milliseconds);
    var tYear = today.getFullYear();  
    var tMonth = today.getMonth();  
    var tDate = today.getDate();  
    tMonth = doHandleMonth(tMonth + 1);  
    tDate = doHandleMonth(tDate);  
    return tDate+"-"+tMonth+"-"+tYear;  
}
function doHandleMonth(month){
    var m = month;  
    if(month.toString().length == 1){  
       m = "0" + month;  
    }  
    return m;  
}
var testList = []
dagen.forEach(dag => {
  var test = getDay(dag)
  let day0 = 0; var day1 = 0; var day2 = 0; var day3 = 0; var day4 = 0; var day5 = 0; var day6 = 0; var day7 = 0;
  settings.forEach(setting => {
    if (setting.day === test) {
      if (dag === -7) var day0 = day0 + parseInt(setting.duration)
      if (dag === -6) var day1 = day1 + parseInt(setting.duration)
      if (dag === -5) var day2 = day2 + parseInt(setting.duration)
      if (dag === -4) var day3 = day3 + parseInt(setting.duration)
      if (dag === -3) var day4 = day4 + parseInt(setting.duration)
      if (dag === -2) var day5 = day5 + parseInt(setting.duration)
      if (dag === -1) var day6 = day6 + parseInt(setting.duration)
      if (dag === 0) var day7 = day7 + parseInt(setting.duration)
    }
  })
  testList.push(test)
})

function test() {
  
}

      renderTemplate(res, req, "charts.ejs", { guild, settings: grafiekSettings, alert: null });
    });

    const testport = process.env.PORT || 80
  app.listen(testport, null, null, () => console.log(`Dashboard is up and running on port ${testport}.`));
};
