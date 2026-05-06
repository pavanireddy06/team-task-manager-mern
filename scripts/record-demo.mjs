import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const appUrl = "https://team-task-manager-production-4354.up.railway.app";
const adminEmail = "admin1778092242997@demo.com";
const memberEmail = "member1778092242997@demo.com";
const password = "password123";
const outputDir = path.resolve("demo-video");
const finalVideo = path.join(outputDir, "team-task-manager-demo.webm");

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: outputDir, size: { width: 1440, height: 900 } }
});
const page = await context.newPage();

async function pause(ms = 1400) {
  await page.waitForTimeout(ms);
}

async function login(email) {
  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByRole("heading", { name: "Dashboard" }).waitFor();
  await pause(2200);
}

await login(adminEmail);
await page.getByRole("button", { name: "Projects" }).click();
await pause(2200);
await page.getByRole("button", { name: "Tasks" }).click();
await pause(1800);
await page.getByLabel("Overdue").check();
await pause(1800);
await page.getByLabel("Overdue").uncheck();
await pause(900);
await page.locator(".task-actions select").first().selectOption("in-progress");
await pause(1700);
await page.getByRole("button", { name: "Log out" }).click();
await pause(1200);

await login(memberEmail);
await page.getByRole("button", { name: "Tasks" }).click();
await pause(1800);
await page.locator(".task-actions select").first().selectOption("completed");
await pause(1800);
await page.getByRole("button", { name: "Dashboard" }).click();
await pause(2200);

const video = page.video();
await context.close();
await browser.close();

const videoPath = await video.path();
fs.copyFileSync(videoPath, finalVideo);
console.log(finalVideo);
