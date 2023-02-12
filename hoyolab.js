core = require('@actions/core');
puppeteer = require('puppeteer');
selectors = require('./selectors.json');
require('dotenv').config()


async function start(cookies) {
    cookies = cookiesToArray(cookies)

    //* Start browser
    console.log("Trying to launch a browser");
    try {
        browser = await puppeteer.launch({ headless: true });
        page = (await browser.pages())[0];
    } catch (error) {
        console.log(error);
        core.setFailed('Failed to launch browser!');
        await closeBrowser();
        return false
    }
    url = `https://hoyolab.com/`;

    //* An attempt to get a reward for each of the accounts
    for (let i = 0; i < cookies.length; i++) {
        console.log("");
        console.log(`Account ${i+1} of ${cookies.length}`);
        const account = cookies[i];
        console.log("Authentication attempt using cookies");
        try {
            for (let cookie of account) {
                console.log(" Setting cookies: ", cookie.name);
                page.setCookie({
                    'name': cookie.name,
                    'value': cookie.value,
                    'domain': ".hoyolab.com"
                });
            }
        } catch (error) {
            console.log(error);
            core.setFailed('Failed to set cookies!');
            continue;
        }
        if (i == 0) {
            console.log("Trying to open the HoYoLAB site");
            try {
                await page.goto(url)
            } catch (error) {
                console.log(error);
                core.setFailed('The site could not be opened, please try again later');
                continue;
            }
    
            console.log("Trying to find a daily rewards tool");
            try {
                // waiting for the list of tools
                await page.waitForSelector(selectors.hoyolab.tools)
                // opening the rewards page
                await page.evaluate(new Function(`return new Promise(resolve => {
                    var tools = document.querySelectorAll('${selectors.hoyolab.tools}');
                    tools.forEach(toolList => {
                        var allToolsInList = toolList.querySelectorAll('${selectors.hoyolab.toolName}');
                        allToolsInList.forEach(tool => {
                            if (tool.innerText.trim() == '${selectors.hoyolab.targetToolName}') {
                                var btn = tool.closest(".tools-item")
                                console.log(btn);
                                var icon = btn.querySelector(".tool-logo")
                                console.log(icon);
                                icon.click()
                                resolve(icon)
                            }
                        });
                    });                
                });`));
            } catch (error) {
                console.log(error);
                core.warning(" The required page element was not found");
                continue;
            }
            //* Receiving rewards
            await page.waitForTimeout(1000)
            checkInPage = (await browser.pages())[1];
        }

        await checkInPage.reload();
        await checkInPage.waitForSelector(selectors.checkIn.rewards);
        console.log("Trying to close the banner");
        var baner = false
        for (let a = 0; a < 3; a++) {
            baner = await checkInPage.evaluate(new Function(`return new Promise(resolve => {
                var baner = document.querySelector('${selectors.checkIn.closeModal}');
                if (baner) resolve(true);
                else resolve(false);
            });`));
            if (baner) break;
            else await checkInPage.waitForTimeout(1000);            
        }

        if (baner) await checkInPage.evaluate(new Function(`return new Promise(resolve => {
            var x = document.querySelector('${selectors.checkIn.closeModal}').click();
            resolve(x);
        });`));
        

        await page.waitForTimeout(2000)
        console.log("Trying to find the reward item");
        try {
            // click on the element
            await checkInPage.evaluate(new Function(`return new Promise(resolve => {
                var rewards = document.querySelectorAll('${selectors.checkIn.rewards}');
                for (let a = 0; a < rewards.length; a++) {
                    var reward = rewards[a];
                    if (reward.classList.length == 1) {
                        reward = rewards[a-1];
                        console.log(reward);
                        reward.click();
                        resolve(true);
                        break;
                    }
                }
            });`));

            await checkInPage.waitForTimeout(1500);
            var reward = await checkInPage.evaluate(new Function(`return new Promise(resolve => {
                var result = false;
                result = document.querySelector('${selectors.checkIn.modal.revard}')
                if (result) result = result.innerText;
                resolve(result);
            });`));
            if (reward) console.log(` Tomorrow you will receive: ${reward}`);
            else console.log(` You didn't get anything`);
            
        } catch (error) {
            console.log(error);
        }

        if (i == cookies.length) {
            console.log("Closing the checkIn page");
            await checkInPage.close();
        }
    };
    console.log("\nAll tasks completed.");
    await closeBrowser();
}

function cookiesToArray(cookies) {
    for (let i = 0; i < cookies.length; i++) {
        cookie = [];
        cookies[i].split(";").forEach(el => {
            a = el.split("=");
            if (a[0].length > 0) cookie.push({ name: a[0], value: a[1] });
        });
        cookies[i] = cookie;
    }
    return cookies;
}

async function closeBrowser() {
    console.log("Trying to close the browser");
    try {
        await page.close();
        await browser.close();
    } catch (error) {
        console.log(error);
        core.warning("Failed to close browser. Don't worry, it will disappear when the action is finished, it should not affect the operation of the program");
    }
    
}

module.exports.start = start;
