// We import modules.
const url = require("url");
const path = require("path");
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const Strategy = require("passport-discord").Strategy;
const config = require("../config");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const Discord = require("discord.js");
const GuildSettings = require("../models/settings");
const IpCheck = require("../models/ipcheck");
const CustomCommands  = require('../models/custom-commands')

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

  // IP checker endpoint.
  app.get("/ip-check/:guildID", checkAuth, async (req, res) => {
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    console.log(ip.slice(7))
    const result = await IpCheck.findOne({ serverId: req.params.guildId, ip: ip })
    var guild = req.params.guildId
    if (result) renderTemplate(res, req, "denied.ejs", { guild, settings: result, alert: null });
    else renderTemplate(res, req, "acces.ejs", { guild, settings: ip, alert: null });
  });

  // Dashboard endpoint.
  app.get("/dashboard", checkAuth, (req, res) => {
    renderTemplate(res, req, "dashboard.ejs", { perms: Discord.Permissions });
  });

  // Settings endpoint.
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

    // We retrive the settings stored for this guild.
    var storedSettings = await GuildSettings.findOne({ gid: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        gid: guild.id
      });
      await newSettings.save().catch(()=>{});
      storedSettings = await GuildSettings.findOne({ gid: guild.id });
    }
  
    renderTemplate(res, req, "settings.ejs", { guild, settings: storedSettings, alert: null });
  });

    // Settings endpoint.
    app.post("/dashboard/:guildID", checkAuth, async (req, res) => {
        // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
        const guild = client.guilds.cache.get(req.params.guildID);
        if (!guild) return res.redirect("/dashboard");
        const member = guild.members.cache.get(req.user.id);
        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has("MANAGE_GUILD")) return res.redirect("/dashboard");
        // We retrive the settings stored for this guild.
        var storedSettings = await GuildSettings.findOne({ gid: guild.id });
        if (!storedSettings) {
          // If there are no settings stored for this guild, we create them and try to retrive them again.
          const newSettings = new GuildSettings({
            gid: guild.id
          });
          await newSettings.save().catch(()=>{});
          storedSettings = await GuildSettings.findOne({ gid: guild.id });
        }
      
        // We set the prefix of the server settings to the one that was sent in request from the form.
        storedSettings.prefix = req.body.prefix;
        // We save the settings.
        await storedSettings.save().catch(() => {});

        // We render the template with an alert text which confirms that settings have been saved.
        renderTemplate(res, req, "settings.ejs", { guild, settings: storedSettings, alert: "Your settings have been saved." });
    });

    // Settings endpoint.
  app.get("/dashboard/:guildID/commands", checkAuth, async (req, res) => {
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
    var storedSettings = await CustomCommands.find({ serverId: guild.id });
    if (!storedSettings) {
      renderTemplate(res, req, "commands.ejs", { guild, alert: null });
    } else {
    renderTemplate(res, req, "commands.ejs", { guild, settings: storedSettings, alert: null });
    }
  });

    // Settings endpoint.
    app.post("/dashboard/:guildID/commands", checkAuth, async (req, res) => {
        // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
        const guild = client.guilds.cache.get(req.params.guildID);
        if (!guild) return res.redirect("/dashboard");
        const member = guild.members.cache.get(req.user.id);
        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has("MANAGE_GUILD")) return res.redirect("/dashboard");

        // console.log(req.body)
        if (req.body.task === "EDIT" || req.body.task === "NEW") {
          if (req.body.task === "EDIT") var newSettings = await CustomCommands.findById(req.body.commandId);
          if (req.body.task === "NEW") var newSettings = await new CustomCommands({ serverId: guild.id });
          for (var i=1; i<(Object.keys(req.body).length)-6; i++) {
            if(i===1) newSettings.action1 = req.body.action1; newSettings.value1 = req.body.value1;
            if(i===2) newSettings.action2 = req.body.action2; newSettings.value2 = req.body.value2;
            if(i===3) newSettings.action3 = req.body.action3; newSettings.value3 = req.body.value3;
            if(i===4) newSettings.action4 = req.body.action4; newSettings.value4 = req.body.value4;
          }
          if (req.body.name) newSettings.name = req.body.name;
          if (req.body.description) newSettings.description = req.body.description;
          if (req.body.action) newSettings.action = req.body.action;
          if (req.body.value) newSettings.value = req.body.value;
          await newSettings.save().catch((err) => {console.log(err)});
        }

        if (req.body.task === "DELETE") var newSettings = await CustomCommands.deleteOne({ _id: req.body.commandId });

        var storedSettings = await CustomCommands.find({ serverId: guild.id });
    if (!storedSettings) {
      renderTemplate(res, req, "commands.ejs", { guild, alert: null });
    } else {
    renderTemplate(res, req, "commands.ejs", { guild, settings: storedSettings, alert: "Your settings have been saved." });
    }
    });
    const testport = process.env.PORT || 80
  app.listen(testport, null, null, () => console.log(`Dashboard is up and running on port ${testport}.`));
};
