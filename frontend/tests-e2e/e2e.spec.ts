import { test, expect } from "@playwright/test";

test.describe("LearnBridge E2E Suite with Neon DB", () => {
  test("1. Student PIN login with Neon DB (Class Code CLS3A + PIN 1234)", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("http://localhost:3000/student/login");
    await expect(page.locator("h1")).toContainText(/Welcome back, Learner!/i);

    // Verify Class Code and PIN fields are pre-filled or fill them
    const classCodeInput = page.locator('input[type="text"]').first();
    await classCodeInput.fill("CLS3A");

    const pinInput = page.locator('input[type="password"]').first();
    await pinInput.fill("1234");

    // Click "Let's Go! 🚀"
    const submitBtn = page.getByRole("button", { name: /Let's Go/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify redirected to student home dashboard
    await page.waitForURL(/.*student\/home/, { timeout: 10000 });
    await expect(page.locator("body")).toContainText(/Practice|Coins|Streak|Learner/i);

    expect(errors.length).toBe(0);
  });

  test("2. Adaptive Practice Player with explanations and audio", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    // First login as student ananya_v to establish session
    await page.goto("http://localhost:3000/student/login");
    const identInput = page.locator('input[placeholder*="ananya_v"]').first();
    if (await identInput.isVisible()) {
      await identInput.fill("ananya_v");
    }
    const submitBtn = page.getByRole("button", { name: /Let's Go/i });
    await submitBtn.click();
    await page.waitForURL(/.*student\/home/, { timeout: 10000 });

    // Click "Start Practice 🎯" from the home dashboard
    const startPracticeLink = page.getByRole("link", { name: /Start Practice/i });
    await expect(startPracticeLink).toBeVisible();
    await startPracticeLink.click();

    // Verify redirected to practice player
    await page.waitForURL(/.*student\/practice/, { timeout: 10000 });

    // Wait for question to render
    const questionHeader = page.locator("h2").first();
    await expect(questionHeader).toBeVisible({ timeout: 15000 });

    // Verify options are present (minimum 2 options)
    const options = page.locator("button.min-h-\\[58px\\]");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThanOrEqual(2);

    // Select the first option
    await options.first().click();

    // Click "Check Answer"
    const checkBtn = page.getByRole("button", { name: /Check Answer/i });
    await expect(checkBtn).toBeEnabled();
    await checkBtn.click();

    // Verify feedback and explanation section is displayed
    await page.waitForTimeout(1000);
    const feedbackBox = page.locator("div.rounded-3xl.border-2").first();
    await expect(feedbackBox).toBeVisible();

    // Verify "Next Question" button is visible
    const nextBtn = page.getByRole("button", { name: /Next Question/i });
    await expect(nextBtn).toBeVisible();

    expect(errors.length).toBe(0);
  });

  test("3. Teacher Review page displays pedagogical explanations and edit form", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    // Navigate to teacher review
    await page.goto("http://localhost:3000/teacher/review");

    // Check header
    await expect(page.locator("h1")).toContainText(/Review Questions/i);

    // Wait for cards to load
    await page.waitForTimeout(1500);

    // Check for explanation box on card
    const explanationSection = page.getByText(/Explanation & Why this answer is correct/i).first();
    await expect(explanationSection).toBeVisible({ timeout: 5000 });

    // Click "Edit" on the first card
    const editBtn = page.getByRole("button", { name: /Edit/i }).first();
    await editBtn.click();

    // Verify edit form fields appear
    await expect(page.getByText(/Pedagogical Explanation & Rationale/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Save Changes/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Cancel/i })).toBeVisible();

    // Click Cancel
    await page.getByRole("button", { name: /Cancel/i }).click();

    expect(errors.length).toBe(0);
  });
});
