// lambda/index.js
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

exports.handler = async (event: { body: any; }) => {
  console.log('Incoming event:', event);
  try {
    const { catId, savedUrl } = JSON.parse(event.body || '{}');
    if (!catId || !savedUrl) {
      console.error('Invalid request body:', event.body);
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing parameters' }) };
    }

    // Store favorite cat (overwrite existing one)
    await dynamo.put({
      TableName: process.env.TABLE_NAME,
      Item: { PK: 'FAVORITE', catId, savedUrl, updatedAt: new Date().toISOString() }
    }).promise();
    console.log(`Saved favorite cat: ${catId}`);

    // Notify Lydia
    await sns.publish({
      TopicArn: process.env.TOPIC_ARN,
      Subject: 'New Favorite Cat!',
      Message: `You have a new favorite cat!\n${savedUrl}`
    }).promise();
    console.log('Notification sent');

    return { statusCode: 200, body: JSON.stringify({ message: 'Cat saved' }) };
  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
