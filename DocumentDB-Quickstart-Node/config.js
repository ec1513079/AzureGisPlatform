var config = {}

config.host = process.env.HOST || "https://opendatagis.documents.azure.com:443/";
config.authKey = process.env.AUTH_KEY || "fAF9vtgqFUQWfOmrH4YNdDGRc1Gf01XTy9G9wnVnSxyZhFHpijXgkRolnvO1vtirhYqbcG8Qq2tpGKndU7SSYw==";
config.databaseId = "ToDoList";
config.collectionId = "Items";

module.exports = config;