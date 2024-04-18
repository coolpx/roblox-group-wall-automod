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
    ugc_callout: 0.82,
    scam: 0.85,
    spam: 0.8,
    hate: 0.8,
    begging: 0.8
};

const deletePostsWithUrls = true;

// main function
async function main() {
    const user = await noblox.setCookie(secrets.cookie);
    const userRankInGroup = await noblox.getRankInGroup(
        secrets.groupId,
        user.UserID
    );
    const groupWall = noblox.onWallPost(secrets.groupId);

    groupWall.on('connect', function () {
        console.log(`logged in as @${user.UserName} (${user.UserID})`);
    });

    groupWall.on('data', async function (post) {
        // return if post is by a higher ranked user (bot cannot delete their post)
        if (post.poster.role.rank > userRankInGroup) {
            console.log(
                `ignoring post by higher ranked user @${post.poster.user.username} (${post.poster.user.userId})`
            );
            return;
        }

        // check for urls
        let shouldDelete = false;
        let deleteReason = '';

        if (deletePostsWithUrls) {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urls = post.body.match(urlRegex);

            if (urls) {
                shouldDelete = true;
                deleteReason = 'contains urls';
            }
        }

        // analyze sentiment
        if (!shouldDelete) {
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
                    shouldDelete = true;
                    deleteReason = `contains ${
                        intent.name
                    } with confidence ${Math.round(intent.confidence * 100)}%`;
                    break;
                }
            }
        }

        // take action
        if (shouldDelete) {
            console.log(
                `flagged post by @${post.poster.user.username} (${post.poster.user.userId}): ${deleteReason}\n> ${post.body}`
            );
            noblox.deleteWallPost(secrets.groupId, post.id);
            return;
        }
        console.log(
            `received post by @${post.poster.user.username} (${post.poster.user.userId})\n> ${post.body}`
        );
    });

    groupWall.on('error', function (err) {
        console.error(err);
    });
}

main();
