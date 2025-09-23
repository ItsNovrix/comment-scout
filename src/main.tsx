import { Devvit } from "@devvit/public-api";
import { DateTime } from "ts-luxon";

import { addSettings } from "./settings/settings.js";
import {
	getActionSettings,
	getCommentIgnorePreference,
	getCommentSettings,
	getReminderSettings
} from "./settings/getters.js";
import { checkComments, checkPost } from "./list_check/list_check.js";
import { executeAction } from "./actions/action.js";
import { sendReminder } from "./actions/reminder.js";

Devvit.configure({
	redditAPI: true
});

// Initialise settings
addSettings();

/**
 * Trigger on new Post,
 * - check if a Post matches the post requirements (black/white list) and needs to be processed further,
 * - if yes, check if the notice comment or action are enabled and schedule them as necessary.
 */
Devvit.addTrigger({
	event: "PostCreate", onEvent: async(event, context) => {
		const postV2 = event.post;

		if (!postV2) {
			return;
		}

		const postId = postV2.id;
		const post = await context.reddit.getPostById(postId);

		let userFlairText = "";
		let userFlairID = "";
		const userFlair = event.author?.flair;

		if (userFlair) {
			userFlairText = userFlair.text;
			userFlairID = userFlair.templateId;
		}

		// Check white/black list and ignore preference
		if (!(await checkPost(context, post, userFlairText, userFlairID))) {
			console.info(`${postId}: Ignoring (post doesn't match requirements)`);
			return;
		}

		console.info(`${postId}: Processing (post matches requirements)`);

		const reminderSettings = await getReminderSettings(post, context);
		const actionSettings = await getActionSettings(context);
		const now = DateTime.now();

		// Schedule Notice
		if (reminderSettings.enabled && reminderSettings.message) {

			// Short delay jobs can fail, send reminder immediately if less than 10 minutes
			if (reminderSettings.delay >= 10) {
				console.info(`${postId}: Scheduling Reminder`);
				const jobId = await context.scheduler.runJob({
					name: "reminder", data: {
						postId: postId,
						removeDelay: reminderSettings.removeDelay,
						message: reminderSettings.message,
						rawOptions: reminderSettings.options,
						userFlairText: userFlairText,
						userFlairID: userFlairID
					}, runAt: now.plus({minutes: reminderSettings.delay}).toJSDate()
				});
			} else {
				await sendReminder(context, post, reminderSettings.removeDelay, reminderSettings.message,
					reminderSettings.options, now);
			}
		}

		// Schedule Action

		// For crossposts
		if (postV2.crosspostParentId && !(actionSettings.crossAction == "default")) {
			if (actionSettings.crossAction == "do_nothing") {
				return;
			}

			console.info(`${postId}: Scheduling Crosspost Action (${actionSettings.crossAction})`);
			const jobId = await context.scheduler.runJob({
				name: "action", data: {
					postId: postId, userFlairText: userFlairText, userFlairID: userFlairID, crosspost: true
				}, runAt: now.plus({minutes: actionSettings.delay}).toJSDate()
			});
		} else if (actionSettings.action && !(actionSettings.action == "do_nothing")) {
			console.info(`${postId}: Scheduling Action (${actionSettings.action})`);
			const jobId = await context.scheduler.runJob({
				name: "action", data: {
					postId: postId, userFlairText: userFlairText, userFlairID: userFlairID, crosspost: false
				}, runAt: now.plus({minutes: actionSettings.delay}).toJSDate()
			});
		}

	}
});

/**
 * Schedule a notice comment,
 * - check if the post still matches the requirements and no comments that match the comment requirements have been made.
 * - schedule a notice removal if needed.
 */
Devvit.addSchedulerJob({
	name: "reminder", onRun: async(event, context) => {
		const {postId, removeDelay, message, rawOptions, userFlairText, userFlairID} = event.data!;

		console.info(`${postId}: Processing Reminder`);

		if (!postId || !message) {
			return;
		}

		const post = await context.reddit.getPostById(postId.toString());

		// Check if the post still matches the requirements and no comments that match the comment requirements have been made.
		if (!(await checkPost(context, post, String(userFlairText), String(userFlairID))) || await checkComments(
			context, post, await getCommentSettings(context), await getCommentIgnorePreference(context))) {
			console.info(`${postId}: Reminder Cancelled (post doesn't match requirements)`);
			return;
		}

		console.info(`${postId}: Sending Reminder`);

		const comment = await post.addComment({
			text: message.toString()
		});

		// Get comment mod options, lock by default
		const options = Array.isArray(rawOptions) ? rawOptions : [];
		await comment.lock();

		// Set mod options
		if (options.length > 0) {
			if (options.includes("sticky")) {
				await comment.distinguish(true);
			} else if (options.includes("distinguish")) {
				await comment.distinguish(false);
			}
                        if (options.includes("lock")) {
				await comment.lock();
                     }
		}

		// Auto-remove notice
		if (Number(removeDelay) > 0) {
			console.info(`${postId}: Scheduling Reminder Removal (${comment.id})`);
			const now = DateTime.now();

			const jobId = await context.scheduler.runJob({
				name: "reminder-removal", data: {
					commentID: comment.id.toString()
				}, runAt: now.plus({minutes: Number(removeDelay)}).toJSDate()
			});
		}
	}
});

/**
 * Schedule a notice removal,
 * - remove a given notice if it hasn't already been removed.
 */
Devvit.addSchedulerJob({
	name: "reminder-removal", onRun: async(event, context) => {
		const {commentID} = event.data!;

		console.info(`${commentID}: Processing Reminder Removal`);

		if (!commentID) {
			return;
		}

		const comment = await context.reddit.getCommentById(commentID.toString());

		if (comment.isRemoved() || comment.isSpam() || comment.bannedAtUtc) {
			console.error(`${commentID}: Reminder Already Removed`);
			return;
		}

		await comment.remove(false);
		console.info(`${commentID}: Reminder Removed`);
	}
});

/**
 * Schedule an action,
 * - check if the post still matches the requirements and no comments that match the comment requirements have been made.
 * - act on the Post.
 */
Devvit.addSchedulerJob({
	name: "action", onRun: async(event, context) => {
		const {postId, userFlairText, userFlairID, crosspost} = event.data!;

		console.info(`${postId}: Processing Action`);

		if (!postId) {
			return;
		}

		const post = await context.reddit.getPostById(postId.toString());

		// Check if the post still matches the requirements and no comments that match the comment requirements have been made.
		if (!(await checkPost(context, post, String(userFlairText), String(userFlairID))) || await checkComments(
			context, post, await getCommentSettings(context), await getCommentIgnorePreference(context))) {
			console.info(`${postId}: Action Cancelled (post doesn't match requirements)`);
			return;
		}

		console.info(`${postId}: Executing Action`);
		await executeAction(context, post, Boolean(crosspost));
	}
});

export default Devvit;
