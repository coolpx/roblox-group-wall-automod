const noblox = require('noblox.js')
const groupid = 16378284

const blacklistedTerms = [
    'hello',
    'goodbye',
    'fake',
    'report'
]



const cookie = require('./secrets')

const wallpost = noblox.onWallPost(groupid)
const userCookie = noblox.setCookie(cookie.getCookie())

console.log('logged in as ', userCookie.UserName, ' id: ', userCookie.UserID)

wallpost.on('data', function(data) {
    console.log(data.body)
    console.log(data.id)
        for (let i in blacklistedTerms) {
            let lower = data.body.toLowerCase()
            if (lower.match(blacklistedTerms[i])) {
                console.log('found a blacklisted term!')

                noblox.deleteWallPost(groupid, data.id)
            }
        }
}) 
wallpost.on('error', function(err) {
    console.error(err)
})