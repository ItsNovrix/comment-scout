import { JobContext, Post } from "@devvit/public-api";
import { checkComments } from "../list_check/list_check.js";
import { getCommentIgnorePreference, getCommentSettings } from "../settings/getters.js";
import { DateTime } from "ts-luxon";

/**
 * Send a notice comment,
 * - check if the post still matches the requirements and no comments that match the comment requirements have been made.
 * - schedule a notice removal if needed.
 */
export async function sendReminder(context: JobContext, post: Post, removeDelay: number, message: string,
                                   rawOptions: string[], now: DateTime): Promise<void> {
	console.info(`${post.id}: Processing Reminder`);

	// Check if the post still matches the requirements and no comments that match the comment requirements have been made
	if (await checkComments(context, post, await getCommentSettings(context),
		await getCommentIgnorePreference(context))) {
		console.info(`${post.id}: Reminder Cancelled (post doesn't match requirements)`);
		return;
	}

	console.info(`${post.id}: Sending Reminder`);

	const comment = await post.addComment({
		text: message
	});

	// Get comment mod options
	const options = rawOptions;
	// await comment.lock();

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
	if (removeDelay > 0) {
		console.info(`${post.id}: Scheduling Reminder Removal (${comment.id})`);

		const jobId = await context.scheduler.runJob({
			name: "reminder-removal", data: {
				commentID: comment.id.toString()
			}, runAt: now.plus({minutes: removeDelay}).toJSDate()
		});
	}
}