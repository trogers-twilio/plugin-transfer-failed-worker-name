const Twilio = require('twilio');
const TokenValidator = require('twilio-flex-token-validator').functionValidator;

exports.handler = TokenValidator(async function(context, event, callback) {
  const {
    ACCOUNT_SID,
    AUTH_TOKEN,
    WORKSPACE_SID
  } = context;
  
  const client = Twilio(ACCOUNT_SID, AUTH_TOKEN);

  const {
    workerSid
  } = event;

  const response = new Twilio.Response();
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST GET');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.appendHeader('Content-Type', 'application/json');

  console.log('Worker SID:', workerSid);

  const worker = await client.taskrouter
    .workspaces(WORKSPACE_SID)
    .workers(workerSid)
    .fetch();

  console.log('Returned worker:', worker);

  const { attributes, sid } = worker;
  const workerAttributes = attributes && JSON.parse(attributes);

  const { email, full_name: fullName } = workerAttributes;

  response.setBody({
    email,
    fullName,
    sid
  });

  callback(null, response);
});
