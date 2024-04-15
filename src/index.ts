// modules
import noblox from 'noblox.js';
import secrets from './secrets.json';

// types
type Intent = {
    confidence: number;
    id: string;
    name: string;
};

type Sentiment = {
    entities: {};
    intents: Intent[];
    text: string;
    traits: {};
};

// constants
const intentFlagThresholds: { [intentName: string]: number } = {
    ugc_callout: 0.8,
    scam: 0.9,
    hate: 0.7,
    begging: 0.8
};

// main function
async function main() {
    const user = await noblox.setCookie(secrets.cookie);
    const groupWall = noblox.onWallPost(secrets.groupId);

    groupWall.on('connect', function () {
        console.log(`logged in as @${user.UserName} (${user.UserID})`);
    });

    groupWall.on('data', async function (post) {
        // analyze sentiment
        const response = await fetch(
            `https://api.wit.ai/message?v=20240415&q=${post.body}`,
            {
                headers: {
                    Authorization: `Bearer ${secrets.witai}`
                }
            }
        );
        const sentiment: Sentiment = await response.json();

        // check if sentiment is above threshold
        for (const intent of sentiment.intents) {
            if (intent.confidence > intentFlagThresholds[intent.name]) {
                console.log(
                    `flagged post by @${post.poster.user.username} (${
                        post.poster.user.userId
                    }) with intent ${intent.name} (${Math.round(
                        intent.confidence * 100
                    )}% confidence)\n> ${post.body}`
                );
                noblox.deleteWallPost(secrets.groupId, post.id);
                return;
            }
        }

        // log if not flagged
        console.log(
            `received post by @${post.poster.user.username} (${post.poster.user.userId})\n> ${post.body}`
        );
    });

    groupWall.on('error', function (err) {
        console.error(err);
    });
}

main();
