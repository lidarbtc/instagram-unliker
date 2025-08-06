/**
 * Instagram Like Removal Script - Enhanced Timing (2025)
 * based on the comment activity deleter by sbolel, fixed and modified to work for likes as well
 * COPYRIGHT:
 * 1. https://gist.github.com/sbolel/a2b2bfde16b3ab185fbc2e2049240abc
 * 2. https://gist.github.com/therealsarahw/093d21125b2251c0be3b90fe5214ebd0
 * 3. https://gist.github.com/braunglasrakete/8a7cad3ecb135470c4b93d7223b0927e
 * 4. https://github.com/lidarbtc/instagram-unliker
 * important: UI language must be set to English for the script to work
 *
 * WARNING: This function directly manipulates the DOM and depends on the current HTML
 *  structure of Instagram's website to work. If Instagram implements changes to the
 *  activity page layout, structure, or functionality, this script may break or cause
 *  unexpected behavior. Use at your own risk and always review code before running it.
 *
 * How to use:
 * 1. Navigate to the Instagram likes page by going to:
 *    https://www.instagram.com/your_activity/interactions/likes
 * 2. Open the developer console in your web browser:
 *    - Chrome/Firefox: Press Ctrl+Shift+J (Windows/Linux) or Cmd+Option+J (Mac)
 *    - Safari: Enable the Develop menu in Safari's Advanced preferences, then press Cmd+Option+C
 * 3. Copy and paste this entire script into the console and press Enter to run it.
 *
 * to speed up the process, you can run the script simultaneously in two browser windows with one
 * like activity sorted from newest to oldest and the other from oldest to newest
 */

(async () => {
	const UNLIKE_BATCH_SIZE = 80;
	const DELAY_BETWEEN_ACTIONS_MS = 1500;
	const DELAY_BETWEEN_CHECKBOX_CLICKS_MS = 100;
	const DELAY_AFTER_SELECT_CLICK_MS = 2000;
	const DELAY_AFTER_ITEMS_VISIBLE_MS = 2000;
	const MAX_RETRIES = 60;

	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	const waitForElement = async (selector, timeout = 30000) => {
		const startTime = Date.now();
		while (Date.now() - startTime < timeout) {
			const element = document.querySelector(selector);
			if (element) return element;
			await delay(100);
		}
		throw new Error(
			`Element with selector "${selector}" not found within ${timeout}ms`,
		);
	};

	const clickElement = async (element) => {
		if (!element) throw new Error("Element not found");
		element.scrollIntoView({ behavior: "smooth", block: "center" });
		element.click();
	};

	const waitForSelectButton = async () => {
		for (let i = 0; i < MAX_RETRIES; i++) {
			const selectSpan = [...document.querySelectorAll("span")].find(
				(el) => el.textContent.trim().toLowerCase() === "select",
			);

			if (selectSpan) {
				console.log(`✅ Select button found after ${i} seconds`);
				return;
			}

			await delay(1000);

			if (i % 10 === 0 && i > 0) {
				console.log(
					`⏳ Still waiting for Select button... ${i} seconds elapsed`,
				);
			}
		}
		throw new Error("Select button not found after maximum retries");
	};

	const unlikeSelectedItems = async () => {
		try {
			const unlikeButton = [...document.querySelectorAll("span")].find((el) =>
				"Unlike".includes(el.textContent.trim()),
			);

			if (!unlikeButton) throw new Error("Unlike button not found");
			await clickElement(unlikeButton);
			await delay(DELAY_BETWEEN_ACTIONS_MS);

			const confirmButton = await waitForElement('button[tabindex="0"]');
			await clickElement(confirmButton);
		} catch (error) {
			console.error("Error during like removal:", error.message);
		}
	};

	const scrollAndWaitForMoreItems = async (previousCount) => {
		window.scrollTo(0, document.body.scrollHeight);
		for (let i = 0; i < 10; i++) {
			await delay(1000);
			const currentCount = document.querySelectorAll(
				'[aria-label="Toggle checkbox"]',
			).length;
			if (currentCount > previousCount) return true;
		}
		return false;
	};

	const removeLikes = async () => {
		try {
			while (true) {
				const selectSpan = [...document.querySelectorAll("span")].find(
					(el) => el.textContent.trim().toLowerCase() === "select",
				);
				if (!selectSpan) throw new Error("Select button not found");
				const selectButton = selectSpan.parentElement;
				if (!selectButton) throw new Error("Select button container not found");

				await clickElement(selectButton);
				await delay(DELAY_AFTER_SELECT_CLICK_MS);

				const checkboxes = document.querySelectorAll(
					'[aria-label="Toggle checkbox"]',
				);
				if (checkboxes.length === 0) {
					const gotMore = await scrollAndWaitForMoreItems(0);
					if (!gotMore) {
						console.log("🚫 No more items to unlike.");
						break;
					}
					continue;
				}

				await delay(DELAY_AFTER_ITEMS_VISIBLE_MS);

				for (
					let i = 0;
					i < Math.min(UNLIKE_BATCH_SIZE, checkboxes.length);
					i++
				) {
					await clickElement(checkboxes[i]);
					await delay(DELAY_BETWEEN_CHECKBOX_CLICKS_MS);
				}

				await delay(DELAY_BETWEEN_ACTIONS_MS);
				await unlikeSelectedItems();
				await delay(DELAY_BETWEEN_ACTIONS_MS);
				await waitForSelectButton();
				await delay(DELAY_BETWEEN_ACTIONS_MS);
			}
		} catch (error) {
			console.error("Error in removeLikes:", error.message);
		}
	};

	// Start script
	try {
		await removeLikes();
		console.log("✅ All likes removed or none left.");
	} catch (error) {
		console.error("Fatal error:", error.message);
	}
})();
