var config = {}

config.host = process.env.HOST || "https://ecgeojsonsample.documents.azure.com:443/";
config.authKey = process.env.AUTH_KEY || "FHjYMtqWxw2sXZaGQ5oug8tKoPMnubvDyfpoL08nTjcbSflsLHnNsnb9SbZX0OM7A491rWc42eVNUk2lG5oDpA==";
config.databaseId = "genkyo";
config.collectionId = "genkyo";

module.exports = config;